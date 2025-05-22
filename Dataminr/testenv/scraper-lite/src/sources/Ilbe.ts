import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.ilbe.com';

async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    for (let index = 1; index <= 3; index++) {
      preThreads.push({
        link: `${baseURL}${href}?page=${index}&listSize=60&listStyle=list`,
        parserName: 'thread',
      });
    }
  });
  return preThreads;
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
    const href = $(el).find('.title a').attr('href');
    const number = $(el).find('.count').text();
    const views = $(el).find('.view').text();
    threads.push({
      link: `${baseURL}${href}`,
      title: `${number} ~ ${views}`,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) {
    return posts;
  }

  const $el = $(elements);
  const date = $el.find('.post-count .date').text()?.split(' ')[0];

  if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    const titleQuery = '.post-header';
    const nicknameQuery = '.post-header .nick';
    const timeQuery = '.post-count .date em';

    const title = fetchText(titleQuery, $, elements);
    const nickname = fetchText(nicknameQuery, $, elements);
    const time = fetchText(timeQuery, $, elements);

    const newData = data.filter((x) => x !== null && x !== '');
    if (newData.length === 0) return [];

    const number = newData[0].split('~')[0];
    const views = newData[0].split('~')[1];

    const timestamp = moment(date, 'YYYY-MM-DD').unix();
    const textInfo = `${title} - ${nickname} - ${date} - ${time}`;
    const extraDataInfo = {
      Number: number,
      Headline: title,
      Nickname: nickname,
      Date: date,
      Views: views,
    };

    posts.push(
      new Post({
        text: textInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Ilbe',
  baseURL,
  [
    {
      selector: ['.widget a:contains(뉴스/정치)'],
      parser: preThreadHandler,
    },
    {
      selector: ['.board-body li:not(.ad-line, .title-line, .notice-line)'],
      parser: threadHandler,
      name: 'thread',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '',
  {
    strictSSL: false,
  },
);
