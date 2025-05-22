import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://kyma.com/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://kyma.com/category/news/imperial-county/';
  const link2 = 'https://kyma.com/category/news/kyma-com-category-news-yuma-county/';
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
    const articlePublishedDate = $(el).find('.story__meta span.meta__date').text().trim();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.story__title a').attr('href');
      const title = $(el).find('.story__title a').text().trim();
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
  const titleQuery = '.entry__header';
  const dateQuery = '.meta__published';
  const articleFullTextQuery = '.entry__content p';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements).replace('Published', '').replace(/\s+/g, ' ').trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY hh:mm a').unix();
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

export const parser = new LiteParser('KYMA', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.stories--row article'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
]);
