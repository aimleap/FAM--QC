import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'http://www.jbnews.com';
const baseURLSuffix = '/news/articleList.html?sc_section_code=S1N28&view_type=sm';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 10; index++) {
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
    const date = $(el).find('.info.dated').text().trim();
    if (moment(date, 'MM.DD hh:mm').isSame(moment(), 'day')) {
      const href = $el.find('h4.titles a').attr('href');
      const headline = $el.find('h4.titles a').text();
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
  const titleQuery = 'h3.heading';
  const title = fetchText(titleQuery, $, elements);
  const articleText = $el.find('article').text().replace(/\n+/g, '').replace(/\t+/g, '')
    .trim();
  const date = $el.find('.infomation li:contains(입력)').text().split('입력')[1].trim();
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
  'Jungbu Daily',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['#section-list ul li'],
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
