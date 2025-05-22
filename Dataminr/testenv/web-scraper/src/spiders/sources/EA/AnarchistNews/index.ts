import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Anarchist News',
  type: SourceTypeEnum.FORUM,
  url: 'https://anarchistnews.org/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2 a').text();
    const time = $(el)
      .find('div [class="submitted-date"]')
      .text()
      .trim()
      .replace(/\s+/g, ' ');
    const link = source.url + $(el).find('h2 a').attr('href');
    const timestamp = moment.utc(time, 'MMM DD YYYY').unix();
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
  const title = $(elements).find('h1').text().trim();
  const time = $(elements)
    .find('div[class="submitted-date"]')
    .text()
    .trim()
    .replace(/\s+/g, ' ');
  const articlefulltext = $(elements)
    .find(
      'div[class="field field-name-body field-type-text-with-summary field-label-hidden"] p',
    )
    .text()
    .replace(/https?:\/\/\S+/g, '');
  const submitteduser = $(elements)
    .find('div[class="submitted-user"] span[class="username"]')
    .text()
    .trim();
  const timestamp = moment.utc(time, 'MMM DD YYYY').unix();
  posts.push(
    new Post(
      `${title}\n${articlefulltext}`,
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
          submitteduser,
          articlefulltext,
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
      selector: ['article'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
