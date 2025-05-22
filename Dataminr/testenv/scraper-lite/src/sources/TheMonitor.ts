import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://myrgv.com';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `https://myrgv.com/category/local-news/page/${index}/`,
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
  if (url === baseURL) return [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const hrefLink = $(el).find('.td-module-title a').attr('href').trim();
    if (hrefLink.includes(todaysDate)) {
      const href = $(el).find('.td-module-title a').attr('href').trim();
      const headline = $(el).find('.td-module-title a').text();
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
  const titleQuery = '.td-post-header .entry-title';
  const dateQuery = '.td-post-date';
  const articleFullTextQuery = '.td-post-content';
  $(elements).find('blockquote').remove();
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements).trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
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

export const parser = new LiteParser('The Monitor', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.td-animation-stack'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['.td-main-content'],
    parser: postHandler,
    name: 'post',
  },
]);
