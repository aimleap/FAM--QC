import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'New ransomware leak entries',
  isCloudFlare: false,
  name: 'El Dorado ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://dataleakypypu7uwblm5kttv726l3iripago6p336xjnbstkjwrlnlid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h1').text().trim();
    const link = $(el).find('a[aria-label="Read"]').attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
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
  const items: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const date = $(elements).find('h4[id="date"]').text().trim();
  const articletext = $(elements).find('div[class="text-center"] h2').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const timestamp = moment(date, 'YYYY/MM/DD hh:mm').unix();
  items.push(
    new Post(
      `${title}; ${articletext}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          domain: title,
          leakdate: date,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[id="content"] article'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
