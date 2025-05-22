import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://journalnow.com';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://journalnow.com/news/local/crime-courts/';
  const link2 = 'https://journalnow.com/news/local/';
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
  elements.forEach((el) => {
    const href = $(el).find('.tnt-headline a').attr('href');
    const headline = $(el).find('.tnt-headline').text().replace(/\n+/g, ' ')
      .trim();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
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
  const $el = $(elements);
  const date = $el.find('.visible-print time').attr('datetime')?.split('T')[0];
  if (!moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) return posts;
  const titleQuery = 'h1.headline';
  const articleFullTextQuery = '#article-body p';
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date,
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

export const parser = new LiteParser(
  'Winston-Salem Journal',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['article.tnt-asset-type-collection, article.tnt-asset-type-article'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
