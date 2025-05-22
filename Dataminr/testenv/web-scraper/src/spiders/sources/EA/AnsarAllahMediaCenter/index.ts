import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Ansar Allah Media Center',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.ansarollah.com/',
};

async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = $(el).find('a').attr('href');
    const timestamp = moment().unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1 span').text().trim();
  const description = $(elements).find('div[class*="entry-content"] p:nth-child(2)').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const articletext = $(elements).find('div[class*="entry-content"] p').contents().text()
    .replace(/[\t\n\s]+/g, ' ');
  const time = $(elements).find('time').attr('datetime');
  const timestamp = adjustTimezone(time, TIME_ZONE['Etc/GMT-3']);
  const category = `Home ,${title}`;
  posts.push(new Post(
    `${articletext}\n${title}`,
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
        category,
        description,
        articlefulltext: articletext,
        ingestpurpose: 'deepweb',
        parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['h2[class="title"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['div[class="row main-section"] article'],
      handler: postHandler,
    },
  ],
  1440,
);
