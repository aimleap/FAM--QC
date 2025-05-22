import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.sedaily.com';
const baseURLSuffix = '/NewsMain/GE';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 3; index++) {
    preThreads.push({
      link: `${baseURLPrefix}${baseURLSuffix}/${index}`,
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
    const date = $(el).find('.rel_time , .date').text().trim();
    if (date.includes('분전') || moment(date, 'YYYY.MM.DD').isSame(moment(), 'day')) {
      const href = $el.find('.article_tit a').attr('href');
      const headline = $el.find('.article_tit a').text();
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
  $el.find('.art_photo').remove();
  $el.find('.article_copy').remove();
  const titleQuery = 'h1.art_tit';
  const articleTextQuery = '.con_left .article_view';
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const date = $el.find('.article_info .url_txt:contains(입력)').text().split('입력')[1].trim();
  const timestamp = moment(date, 'YYYY-MM-DD hh:mm:ss').unix();
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
  'Seoul Economic Daily',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['ul.sub_news_list li'],
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
