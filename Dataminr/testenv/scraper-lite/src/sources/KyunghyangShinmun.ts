import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseUrl = 'https://www.khan.co.kr/newest/articles';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 10; index++) {
    preThreads.push({
      link: `https://www.khan.co.kr/SecListData.html?syncType=async&type=newest&year=&month=&day=&category=&category2=&page=${index}&code=&serial=&search_keyword=`,
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
  const jsonArray = JSON.parse(response.body).items;
  jsonArray.forEach((jObj: any) => {
    const todaysDate = moment().format('YYYYMMDD');
    const artId = jObj.art_id;
    if (artId.startsWith(todaysDate)) {
      const href = jObj.url;
      threads.push({
        link: href,
        title: `${jObj.art_title}`,
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
  if (url === baseUrl) return posts;
  const dateText = fetchText('.byline em', $, elements).replace('입력 :', '').trim();
  const date = moment(dateText, 'YYYY.MM.DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText('h1#article_title', $, elements);
  const articleText = fetchText('#articleBody p', $, elements);
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

export const parser = new LiteParser('Kyunghyang Shinmun', baseUrl, [
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
