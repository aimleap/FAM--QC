import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://westchester.news12.com/category/westchester-news';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  let j = 0;
  for (let index = 0; index <= 10; index++) {
    preThreads.push({
      link: `https://westchester.news12.com/api/contentful/collection?skip=${j}&categories=2brih7NOlAOnRZ7REArZlS&regions=1H3vrQbJ0zU8HAcSAA9gMN`,
      parserName: 'thread',
    });
    j += 6;
  }
  return preThreads;
}
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return threads;
  const jsonArray = JSON.parse(response.body.trim()).stories;
  jsonArray.forEach((jObj: any) => {
    const articlePublicationDate = moment(jObj.publishedAt.split('T')[0]).format('MM/DD/YYYY');
    if (moment(articlePublicationDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = `https://westchester.news12.com/${jObj.slug}`;
      const { title } = jObj;
      threads.push({
        link: href,
        title,
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
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const titleQuery = 'h1.heading';
  const dateQuery = '.public-at';
  const articleFullTextQuery = '.block:not(:has(b))';
  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMM DD, YYYY, hh:mm a').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date: dateText,
    ingestpurpose: 'mdsbackup',
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('News 12 Westchester', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['*'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
