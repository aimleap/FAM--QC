import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://newsis.com';
const baseURLSuffix = '/realnews/?cid=realnews&day=today';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURLPrefix}${baseURLSuffix}&page=${index}`,
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
    const newsDate = $(el).find('.time').text().split('자')[1].trim();
    if (moment(newsDate, 'YYYY.MM.DD hh:mm:ss').isSame(moment(), 'day')) {
      const href = $el.find('.tit a').attr('href');
      const headline = $el.find('.tit a').text().replace(/\n+/g, '').replace(/\t+/g, '')
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
  $el.find('article .thumCont').remove();
  const titleQuery = '.articleView .title_area';
  const articleTextQuery = '.viewer article';
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const date = $el.find('.infoLine .txt').text().split('등록')[1].trim();
  const timestamp = moment(date, 'YYYY.MM.DD hh:mm:ss').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
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
  'Newsis',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.article ul li'],
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
);
