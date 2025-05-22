import moment from 'moment';
import crypto from 'node:crypto';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.yna.co.kr';
const baseURLSuffix = '/news?site=navi_latest_depth01';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURLPrefix}${baseURLSuffix}/${index}`,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.txt-time').text();
    if (moment(newsDate, 'MM-DD hh:mm').isSame(moment(), 'day')) {
      const href = $el.find('.news-con a').attr('href').replace('//www.yna.co.kr', '');
      const headline = $el.find('.tit-news').text().replace(/\n+/g, '').replace(/\t+/g, '')
        .trim();
      threads.push({
        link: href,
        title: `${headline}`,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];

  const $el = $(elements);
  $el.find('.update-time .txt').remove();
  const titleQuery = 'h1.tit';
  const articleTextQuery = '.story-news > p:not(.txt-copyright)';
  const dateQuery = '.update-time';
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD hh:mm').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
    date,
  };

  return [
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  ];
}

export const parser = new LiteParser(
  'Yonhap',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.section01 ul.list li:not(.aside-bnr07)'],
      parser: threadHandler,
      name: 'thread',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
  {
    strictSSL: false,
    // @ts-ignore
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  },
);
