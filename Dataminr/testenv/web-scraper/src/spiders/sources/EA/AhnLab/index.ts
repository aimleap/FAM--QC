import moment from 'moment';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'AhnLab',
  isCloudFlare: false,
  name: 'AhnLab',
  type: SourceTypeEnum.FORUM,
  url: 'https://global.ahnlab.com/site/main.do',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a').attr('href');
    const title = $(el)
      .find('div[class="newsConts"] strong')
      .text()
      .replace(/^\s+|\s+$/gm, '')
      .trim();
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
  const items: Post[] = [];
  let timestamp: number;
  let articlefulltext = $(elements)
    .find('div[class="cont"]')
    .contents()
    .text()
    .replace(/(\r\n|\n|\r)/gm, '')
    .replace(/\t/g, '')
    .trim();
  if (!articlefulltext) {
    articlefulltext = $(elements)
      .find('section[class="entry"] p')
      .contents()
      .text()
      .replace(/^\s+|\s+$/gm, '')
      .replace(/\t/g, '')
      .trim();
    if (!articlefulltext) {
      articlefulltext = $(elements)
        .find('div[class="view"] p')
        .contents()
        .text()
        .replace(/^\s+|\s+$/gm, '')
        .replace(/\t/g, '')
        .trim();
    }
  }
  let title = $(elements)
    .find('div[class="tit"] p')
    .text()
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  if (!title) {
    title = $(elements)
      .find('h1[class*="tit"]')
      .text()
      .replace(/^\s+|\s+$/gm, '')
      .trim();
  }

  let date = $(elements)
    .find('div[class="info"] dl:nth-child(1) dd')
    .text()
    .trim();
  timestamp = moment.utc(date, 'MM-DD-YYYY').unix();
  if (!date) {
    date = $(elements).find('time[class="entry-date"]').text().trim();
    timestamp = moment.utc(date, 'MMMM DD, YYYY').unix();
    if (!date) {
      date = $(elements)
        .find('ul[class="viewInfo"] li')
        .text()
        .replace('Date', '')
        .trim();
      timestamp = moment.utc(date, 'MM-DD-YYYY').unix();
    }
  }
  let username = $(elements)
    .find('a[class="url fn n"]')
    .text()
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  if (!username) {
    username = '';
  }
  let category = $(elements)
    .find('p[class="tax-categories taxonomy"] a')
    .contents()
    .text()
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  if (!category) {
    category = '';
  }

  let tag = $(elements)
    .find('p[class="tax-tags taxonomy"] a')
    .contents()
    .text()
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  if (!tag) {
    tag = '';
  }

  items.push(
    new Post(
      `${articlefulltext}\n${title}\n${tag}`,
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
          username,
          category,
          tag,
          articlefulltext,
          ingestpurpose: 'deepweb',
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
      selector: ['ul[class="newsWrap"] li:not(:first-child)'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['html'],
      handler: postHandler,
    },
  ],
  1440,
);
