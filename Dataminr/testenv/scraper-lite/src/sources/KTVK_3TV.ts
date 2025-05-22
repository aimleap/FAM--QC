import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.azfamily.com/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.azfamily.com/news/';
  const link2 = 'https://www.azfamily.com/news/border/';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return threads;
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const hrefLink = $(el).find('h4.headline a.text-reset').attr('href');
    if (hrefLink.includes(todaysDate)) {
      const href = $(el).find('h4.headline a.text-reset').attr('href');
      const title = $(el).find('h4.headline a.text-reset').text().trim();
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
  const date = moment().format('MM/DD/YYYY');
  const titleQuery = 'h1.headline';
  const articleFullTextQuery = '.article-body';
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date,
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

export const parser = new LiteParser('KTVK 3TV', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['div.flex-feature'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['.article-content-container'],
    parser: postHandler,
    name: 'post',
  },
]);
