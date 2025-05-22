import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://buffalonews.com';
const baseURLSuffix = '/news/#tracking-source=main-nav';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://buffalonews.com/news/local/';
  const link2 = 'https://buffalonews.com/news/local/crime-and-courts/';
  const link3 = 'https://buffalonews.com/business/';
  const link4 = 'https://buffalonews.com/news/local/govt-and-politics/';
  const link5 = 'https://buffalonews.com/news/state-and-regional/';
  const link6 = 'https://buffalonews.com/news/local/history/';
  const link7 = 'https://buffalonews.com/news/national/';
  const link8 = 'https://buffalonews.com/news/world/';
  const urls = [link1, link2, link3, link4, link5, link6, link7, link8];
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
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.tnt-headline a').attr('href');
    const headline = $(el).find('.tnt-headline a').text().replace(/\n+/g, ' ')
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
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
  'Buffalo News',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['article.tnt-asset-type-article'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
  { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' },
);
