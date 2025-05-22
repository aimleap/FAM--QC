import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseUrl = 'https://imnews.imbc.com/news/2023/politics/cal_data.js';
async function preThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const jsonObj = JSON.parse(response.body.trim());
  const dataId = jsonObj.DataId;
  jsonObj.DateList.forEach((jObj: any) => {
    const date = jObj.Day;
    if (moment(date, 'YYYYMMDD').isSame(moment(), 'day')) {
      const currentID = jObj.CurrentID;
      preThreads.push({
        link: `https://imnews.imbc.com/news/2023/politics/${currentID}_${dataId}.js`,
        title: `${date} - ${currentID}`,
        parserName: 'thread',
      });
    }
  });
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
  const jsonArray = JSON.parse(response.body.trim()).Data[0].List;
  jsonArray.forEach((jObj: any) => {
    const date = jObj.StartDate;
    if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = jObj.Link;
      const title = jObj.Title;
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
  if (url === baseUrl) return [];
  const titleQuery = 'h2.art_title';
  const dateQuery = '.date span.input:contains(입력)';
  const articleTextQuery = '.news_txt';
  const dateText = fetchText(dateQuery, $, elements).replace('입력', '').trim();
  const date = moment(dateText, 'YYYY-MM-DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm').unix();
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

export const parser = new LiteParser('MBC News', baseUrl, [
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
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
