import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { ThreadType, SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import Logger from '../../../../lib/logger';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: false,
  name: 'Dox Bin',
  type: SourceTypeEnum.FORUM,
  url: 'https://doxbin.org',
  entryUrl: '/',
  requestOption: {
    forceTor: 'true',
    headers: {
      // ADD USER AGENT ROTATION at each repeat of primary job
      'User-Agent': 'curl/7.56.0', // sometimes OK // note: 'empty' & various standard ua strings blocked by site
      Accept: '*/*',
    },
  },
};

const BACKFILLED_MINUTES = 20; // frequent 400/500s from site, backfill is somewhat irrelevant since
// post times only by 'day' -> use current time if match date (check midnight rollover?)

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  postData: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((el) => {
    const messageBody = $(el).text().trim();

    const postMetadata = JSON.parse(postData[0]);

    posts.push(
      new Post(
        messageBody,
        {
          author_name: postMetadata.authorName,
          author_url: postMetadata.authorUrl,
          current_url: postMetadata.url,
        },
        moment().unix(),
        [], // forumPaths
        [],
        new Map(
          Object.entries({
            title: postMetadata.title,
          }),
        ),
      ),
    );
  });

  return posts;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const itemThreads: ThreadType[] = [];

  let itemCounter = 0; // approximately prioritize the top items in table over lower items with same date
  elements.forEach((el) => {
    try {
      const tds = $(el).find('td');
      const itemTitle = $(tds[0]).text().trim(); // item title
      const itemUrl = $(tds[0]).find('a')[0].attribs.href; // item link
      const authorName = $(tds[3]).text().trim(); // username
      let authorUrl = source.url; // for "anonymous" users link to home page instead
      if (!authorName.includes('Anonymous')) {
        authorUrl = source.url + $(tds[3]).find('a')[0].attribs.href;
      }
      const datetime = $(tds[4]).text().trim();

      if (moment.utc(datetime, 'MMM DDth, YYYY').isSameOrAfter(moment().utc(), 'day')) {
        const randDelay = (Math.floor(Math.random() * 10 + itemCounter) + 1) * 1000; // Delay from 10 to 10+itemct seconds
        itemThreads.push({
          title: JSON.stringify({
            title: itemTitle,
            url: itemUrl,
            authorName,
            authorUrl,
          }),
          link: itemUrl,
          timestamp: moment().unix(), // need to process as current time since ts available from site is only 'date'
          parserName: 'post',
          delay: randDelay,
        });
      }
    } catch (e) {
      Logger.info(`parse error: ${source.url} `, e);
    }
    itemCounter += 1;
  });

  return itemThreads;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['table > tbody > tr'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ["div[class^='show-container']"],
      handler: postHandler,
    },
  ],
  BACKFILLED_MINUTES,
);
