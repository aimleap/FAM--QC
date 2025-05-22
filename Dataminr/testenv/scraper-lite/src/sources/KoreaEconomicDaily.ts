import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseUrl = 'https://www.hankyung.com/all-news';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 5; index++) {
    preThreads.push({
      link: `https://www.hankyung.com/all-news-newslist?newssection=&page=${index}`,
      parserName: 'thread',
    });
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
  if (url === baseUrl) return threads;
  const todaysDate = moment().format('YYYY.MM.DD');
  const jsonArray = JSON.parse(response.body)[todaysDate];
  jsonArray.forEach((jObj: any) => {
    const date = jObj.mobiletime;
    if (moment(date, 'YYYY.MM.DD hh:mm').isSame(moment(), 'day')) {
      const href = jObj.url;
      threads.push({
        link: href,
        title: `${date} - ${jObj.title}`,
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
  if (url === baseUrl) return [];
  const titleQuery = '.article-contents h1.headline';
  const dateQuery = '.item:contains(입력) .txt-date';
  const articleTextQuery = '.article-body-wrap .article-body';
  $(elements).find('.article-figure').remove();
  const dateText = fetchText(dateQuery, $, elements).replace('입력', '').trim();
  const date = moment(dateText, 'YYYY.MM.DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY.MM.DD hh:mm').unix();
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

export const parser = new LiteParser('Korea Economic Daily', baseUrl, [
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
    selector: ['#container'],
    parser: postHandler,
    name: 'post',
  },
]);
