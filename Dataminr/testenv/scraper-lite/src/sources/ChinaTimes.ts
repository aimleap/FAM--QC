import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.chinatimes.com';
const baseURLSuffix = '/realtimenews/?chdtv';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURLPrefix}/realtimenews/?page=${index}&chdtv`,
      parserName: 'thread',
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return threads;
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.meta-info .date').text();
    if (moment(articlePublishedDate, 'YYYY/MM/DD').isSame(moment(), 'day')) {
      const href = `${$(el).find('h3.title>a').attr('href')}?chdtv`;
      const title = $(el).find('h3.title>a').text().trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = '.article-header .article-title';
  const dateQuery = '.article-header .date';
  const timeQuery = '.article-header .hour';
  const articleFullTextQuery = '.article-body p';
  const date = fetchText(dateQuery, $, elements);
  if (!moment(date, 'YYYY/MM/DD').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const time = fetchText(timeQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const dateTime = `${date} ${time}`;
  const timestamp = moment(dateTime, 'YYYY/MM/DD hh:mm').unix();
  const articleInfo = `${title}; ${articleFullText}`;
  const extraDataInfo = {
    title,
    date: dateTime,
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

export const parser = new LiteParser('China Times', baseURLPrefix, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.article-list ul.vertical-list li'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['.article-wrapper>.article-box'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
