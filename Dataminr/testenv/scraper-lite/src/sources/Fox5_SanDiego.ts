import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://fox5sandiego.com/news/';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://fox5sandiego.com/news/border-report/';
  const link2 = 'https://fox5sandiego.com/news/local-news/';
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
    const articlePublishedDate = $(el).find('footer.article-list__article-meta time').attr('datetime')?.split('T')[0].trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.article-list__article-title a').attr('href');
      const headline = $(el).find('.article-list__article-title a').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, '')
        .trim();
      threads.push({
        link: href,
        title: headline,
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
  const titleQuery = 'h1.article-title';
  const dateQuery = '.article-info p:contains(Posted:) time';
  const articleFullTextQuery = '.article-content p';
  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split('/')[0].trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMM DD, YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
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

export const parser = new LiteParser('Fox 5 San Diego', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['section article.article-list__article'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['.site-content'],
    parser: postHandler,
    name: 'post',
  },
]);
