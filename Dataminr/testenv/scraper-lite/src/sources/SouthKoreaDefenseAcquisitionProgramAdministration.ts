import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.dapa.go.kr/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.dapa.go.kr/dapa/main.do';
  const link2 = 'https://www.dapa.go.kr/dapa/na/ntt/selectNttList.do?bbsId=326&menuId=678';
  const link3 = 'https://www.dapa.go.kr/dapa/na/ntt/selectNttList.do?bbsId=309&menuId=681';
  const urls = [link1, link2, link3];
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
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text().replace(/\n+/g, ' ').replace(/\t+/g, '')
      .trim();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
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
  const titleQuery = 'th.title';
  const dateQuery = 'th:contains(작성일)+td';
  const articleTextQuery = '.DB_view_Tbox';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY.MM.DD').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY.MM.DD').unix();
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

export const parser = new LiteParser(
  'South Korea Defense Acquisition Program Administration',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.post-title a[href^=/dapa], .BD_list table>tbody>tr a'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '',
  { strictSSL: false },
);
