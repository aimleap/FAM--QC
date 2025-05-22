import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.ktsm.com';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.ktsm.com/local/';
  const link2 = 'https://www.ktsm.com/news/border-report/';
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
    const articlePublishedDate = $(el).find('time').attr('datetime').split('T')[0].trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.article-list__article-title a').attr('href');
      const title = $(el).find('.article-list__article-title').text().replace(/\n+/g, ' ')
        .trim();
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
  const date = $(elements).find('.article-info .article-meta p:contains(Posted:) time').attr('datetime')?.split('T')[0];
  if (!moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) return posts;
  const titleQuery = '.article-info .article-title';
  const articleFullTextQuery = '.article-body p';
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
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

export const parser = new LiteParser('KTSM', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['#standard-layout .article-list__content article, #main .article-list__article'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
