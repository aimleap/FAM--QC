import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: 'Apex Capital',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.apexcapitalcorp.com/inicio/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="col-12"] h4').text().trim();
    const link = $(el).find('a[class="btn btn-primary my-2"]').attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const articletext = $(elements).find('div[class="col-12 mainContent"]').text().trim()
    .replace(/^\s+|\n+$/gm, '');
  const title = $(elements).find('div[class="col-12 mainTitle"] h1').text().trim();
  const timestamp = moment().unix();
  const text = `${articletext}\n${title}`;
  posts.push(
    new Post(
      text,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          articlefulltext: articletext,
          CompanyName: title,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="row mb-4 bg_dark-grey"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['section[id="mainContentWrapper"] '],
      handler: postHandler,
    },
  ],
  1440,
);
