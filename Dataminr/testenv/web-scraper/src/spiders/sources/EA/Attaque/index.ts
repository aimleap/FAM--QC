import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Attaque',
  type: SourceTypeEnum.FORUM,
  url: 'https://attaque.noblogs.org/',
};
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text();
    const link = $(el).find('a').attr('href');
    const date = $(el).find('+div[class="entry-meta"] span[class="entry-date"]').text().trim();
    const time = `${date}${$(el).find(' +div[class="entry-meta"] a').attr('title')}`;
    moment.locale('fr');
    const timestamp = adjustTimezone(moment.utc(time, 'DD MMMM YYYY hh:mm').format('YYYY-MM-DD hh:mmm A'), TIME_ZONE['Etc/GMT-2']);
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
  const articlefulltext = $(elements).find('div[class="entry-content"] p').contents().text()
    .trim();
  const date = $(elements).find('span[class="entry-date"]').text().trim();
  const time = `${date}${$(elements).find('div[id="content"] div[class="entry-meta"] a').attr('title')}`;
  moment.locale('fr');
  const timestamp = adjustTimezone(moment.utc(time, 'DD MMMM YYYY hh:mm').format('YYYY-MM-DD hh:mmm A'), TIME_ZONE['Etc/GMT-2']);
  posts.push(new Post(
    title,
    {
      current_url: url,
    },
    timestamp,
    [],
    [],
    new Map(
      Object.entries({
        title,
        articlefulltext,
        ingestpurpose: 'deepweb',
        parser_type: PARSER_TYPE.AIMLEAP_PARSER,
      }),
    ),
  ));
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[id="content"] h2'],
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
