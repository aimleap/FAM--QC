import moment from 'moment';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://www.kookje.co.kr/';
const todaysDate = moment().format('YYYYMMDD');

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'http://www.kookje.co.kr/news2011/asp/list.asp?page=1&code=0300';
  const link2 = 'http://www.kookje.co.kr/news2011/asp/list.asp?page=1&code=0100';
  const link3 = 'http://www.kookje.co.kr/news2011/asp/list.asp?page=1&code=0200';
  const link4 = 'http://www.kookje.co.kr/news2011/asp/list.asp?page=1&code=0270';
  const urls = [link1, link2, link3, link4];
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
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const link = $(el).find('dt a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('dt a').attr('href');
      const title = $(el).find('dt a').text().replace(/\n+/g, ' ')
        .trim();
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
  _$: CheerioSelector,
  _elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return [];
  const $ = cheerio.load(iconv.decode(response.body, 'EUC-KR').toString());
  const elements = $('body').get();
  const titleQuery = '.news_title h1';
  const dateQuery = '.f_news_date';
  const articleTextQuery = '#news_textArea .news_article';
  const dateText = fetchText(dateQuery, $, elements).replace('입력 :', '').replace('|', '').trim();
  const date = moment(dateText, 'YYYY-MM-DD hh:mm:ss').format('MM/DD/YYYY hh:mm:ss');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm:ss').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
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
  'Kookje',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.listGisa_layer'],
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
  {
    encoding: 'binary',
  },
);
