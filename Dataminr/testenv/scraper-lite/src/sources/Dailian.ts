import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://dailian.co.kr';
const baseURLSuffix = '/newslist';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 4; index++) {
    preThreads.push({
      link: `${baseURLPrefix}${baseURLSuffix}?page=${index}`,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const time = $(el).find('.colorGrey5').text().trim();
    if (time.includes('시간 전') || time.includes('분 전')) {
      const href = $el.find('.subtitle3 a').attr('href');
      const headline = $el.find('.subtitle3 a').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const $el = $(elements);
  const titleQuery = 'h1.title';
  const title = fetchText(titleQuery, $, elements);
  const articleText = $el.find('.article description > p').text().replace(/\n+/g, '').replace(/\t+/g, '')
    .trim();
  const dateText = $el.find('.divtext2').text().split('수정')[0].trim();
  const date = dateText.split('입력')[1];
  const timestamp = moment(date, 'YYYY.MM.DD hh:mm').unix();
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
  'Dailian',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['#contentsArea .itemContainer .wide1Box'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
