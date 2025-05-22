import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://www.kyeongin.com/main/';

const todaysDate = moment().format('YYYYMMDD');

async function preThreadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const link1 = 'http://www.kyeongin.com/politics';
  const link2 = 'http://www.kyeongin.com/money';
  const link3 = 'http://www.kyeongin.com/society';
  const link4 = 'http://www.kyeongin.com/main/local.php';
  const urls = [link1, link2, link3, link4];
  for (let i = 0; i < urls.length; i++) {
    threads.push({
      link: urls[i],
      parserName: 'threads',
    });
  }
  return threads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('.news-title a').attr('href');
    if (link.includes(todaysDate)) {
      const href = encodeURI($el.find('.news-title a').attr('href'));
      const headline = $el.find('.news-title a').text();
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
  const posts: Post[] = [];
  if (url === baseURL) {
    return posts;
  }

  const $el = $(elements);
  const titleQuery = 'h4.news-title';
  const textQuery = '.news_text .article';

  const title = fetchText(titleQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = $el.find('.news-date .news-date').text().split('입력')[1];

  const timestamp = moment(date, 'YYYY-MM-DD hh:mm').unix();
  const textInfo = title;
  const extraDataInfo = {
    text,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Kyeongin Ilbo',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['ul.sub-newslist li'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
