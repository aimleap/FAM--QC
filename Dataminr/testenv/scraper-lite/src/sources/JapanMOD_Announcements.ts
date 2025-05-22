import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.mod.go.jp';
const baseUrlSuffix = '/j/press/news/news_ja.js';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonArray = JSON.parse(response.body.replace('var newsBox = ', '').trim());
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = `${jObj.mm}/${jObj.dd}`;
    if (moment(articlePublishedDate, 'MM/DD').isSame(moment(), 'day')) {
      const { link } = jObj;
      threads.push({
        link,
        title: articlePublishedDate,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleQuery = '.detail-page>h1';
  const fullTextQuery = '.detail-page:not(h1)';

  const title = fetchText(titleQuery, $, elements);
  const fullText = fetchText(fullTextQuery, $, elements);
  const dateText = data[0];
  const date = moment(dateText, 'MM/DD').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD').unix();

  const newsInfo = `${title}, ${date}, ${fullText}`;
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Japan MOD announcements',
  baseUrlPrefix,
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['.page-center'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
