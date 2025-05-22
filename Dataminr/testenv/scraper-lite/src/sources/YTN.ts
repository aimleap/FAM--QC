import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.ytn.co.kr/news/list.php?mcd=recentnews';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 4; index++) {
    preThreads.push({
      link: `${baseURL}&page=${index}`,
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
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.info .date').text().trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD hh:mm').isSame(moment(), 'day')) {
      const href = $(el).attr('href');
      const headline = $(el).find('.infowrap .til').text();
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
  if (url === baseURL) return [];
  moment.locale('ko');
  const titleQuery = '#wrap h3';
  const dateQuery = '#wrap .time';
  const articleTextQuery = '#wrap .article';
  const dateText = fetchText(dateQuery, $, elements).replace('입력', '').trim();
  const date = moment(dateText, 'YYYY MM DD hh mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY MM DD hh mm').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
    Date: date,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('YTN', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.newslist_wrap .newslist_big a, .newslist_wrap ul li a'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['.container'],
    parser: postHandler,
    name: 'post',
  },
]);
