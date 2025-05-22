import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://www.news1.kr/';
const todaysDate = moment().format('YYYY-MM-DD');

async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const link1 = `https://rest.news1.kr/archive/list?page=1&pg_per_cnt=20&end_date=${todaysDate}&collection=front_news&upper_category_ids=1`;
  const link2 = `https://rest.news1.kr/archive/list?page=1&pg_per_cnt=20&end_date=${todaysDate}&collection=front_news&upper_category_ids=189`;
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    threads.push({
      link: urls[i],
      parserName: 'post',
    });
  }
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return [];
  const jsonObject = JSON.parse(response.body);
  const jsonArray = jsonObject.data;
  jsonArray.forEach((jObj: any) => {
    const time = jObj.pubdate1;
    if (time.includes('분전') || time.includes('시간전')) {
      const { title } = jObj;
      const text = jObj.content;
      const { id } = jObj;
      const Url = `https://www.news1.kr/articles/?${id}`;
      const timestamp = moment(todaysDate, 'YYYY-MM-DD').unix();
      const textInfo = title;
      const extraDataInfo = {
        text,
      };
      posts.push(
        new Post({
          text: textInfo,
          postUrl: Url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'News1 Korea',
  baseURL,
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
