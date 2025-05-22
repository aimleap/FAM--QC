import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://kookbang.dema.mil.kr/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 3; index++) {
    preThreads.push({
      link: `https://www.joongang.co.kr/_CP/537?category=Politics&pageItemId=&page=${index}`,
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
  const threads: Thread[] = [];
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.date').text().trim();
    if (moment(articlePublishedDate, 'YYYY.MM.DD hh:mm').isSame(moment(), 'day')) {
      const href = $(el).find('.card_body h2 a').attr('href');
      threads.push({
        link: href,
        title: articlePublishedDate,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return [];
  const titleQuery = '.article_header h1.headline';
  const articleTextQuery = '#article_body';
  const dateText = data[1];
  const date = moment(dateText, 'YYYY.MM.DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY.MM.DD hh:mm').unix();
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

export const parser = new LiteParser('JoongAng Ilbo', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['ul.story_list li'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
