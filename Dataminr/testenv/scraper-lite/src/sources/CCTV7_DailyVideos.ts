import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://tv.cctv.com/lm#datapd=&datafl=%E5%86%9B%E4%BA%8B&dataszm=';

const todayDate = moment().format('YYYYMMDD');

async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const link1 = `https://api.cntv.cn/NewVideo/getVideoListByColumn?id=TOPC1564109128610932&n=100&sort=desc&p=1&bd=${todayDate}&mode=2&serviceId=tvcctv&cb=cb`;
  const link2 = `https://api.cntv.cn/NewVideo/getVideoListByColumn?id=TOPC1451527941788652&n=100&sort=desc&p=1&bd=${todayDate}&mode=2&serviceId=tvcctv&cb=cb`;
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
  if (url === baseURL) {
    return posts;
  }
  const responseText = response.body.replace('cb(', '').replaceAll(');', '');
  const jsonObj = JSON.parse(responseText);
  const jsonArray = jsonObj.data.list;
  jsonArray.forEach((jObj: any) => {
    const videoDate = jObj.time;
    const videoDateText = videoDate.split(' ')[0];
    const videoDateTimestamp = jObj.focus_date;
    const { title } = jObj;
    const postUrl = jObj.url;
    const timestamp = videoDateTimestamp;
    const articleInfo = `${title} ; ${videoDateText} ; ${postUrl}`;

    posts.push(
      new Post({
        text: articleInfo,
        postUrl,
        postedAt: timestamp,
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser('CCTV 7 Daily Videos', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
