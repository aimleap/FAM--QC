import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Calamada',
  type: SourceTypeEnum.FORUM,
  url: 'https://calamada.com/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4 a').text().trim();
    const link = $(el).find('h4 a').attr('href');
    const time = $(el)
      .find('span[class="item-metadata posts-date"]')
      .text()
      .trim();
    const timestamp = adjustTimezone(
      moment.utc(time, 'MMMM DD , YYYY').format('YYYY-MM-DD hh:mmm A'),
      TIME_ZONE['Africa/Mogadishu'],
    );

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
  const articletext = $(elements)
    .find('div[class="entry-content read-details"] p')
    .text()
    .trim()
    .replace(/^\s+|\n+$/gm, '');
  const title = $(elements).find('h1').text().trim();
  const time = $(elements)
    .find('span[class="item-metadata posts-date"]')
    .text()
    .trim();
  const timestamp = adjustTimezone(
    moment.utc(time, 'MMMM DD , YYYY').format('YYYY-MM-DD hh:mmm A'),
    TIME_ZONE['Africa/Mogadishu'],
  );
  posts.push(
    new Post(
      title,
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
          time,
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
      selector: [
        'div[class*="aft-trending-part aft-4-trending-posts"] div[class*="col-66 float-l"]',
      ],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: [
        'div[class="entry-content-wrap read-single social-after-title"] ',
      ],
      handler: postHandler,
    },
  ],
  1440,
);
