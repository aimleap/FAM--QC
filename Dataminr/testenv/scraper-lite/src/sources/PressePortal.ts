import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.presseportal.de/blaulicht/';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 0; index <= 150;) {
    preThreads.push({
      link: `${baseURL}${index}`,
      parserName: 'thread',
    });
    index += 30;
  }
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
    const $el = $(el);
    const newsDate = $(el).find('.date').text().split('-')[0].trim();
    if (moment(newsDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h3.news-headline-clamp a').attr('href');
      const headline = $el.find('h3.news-headline-clamp').text();
      const location = $el.find('.news-topic').text();
      threads.push({
        link: href,
        title: `${headline}~${location}`,
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

  if (url === baseURL) {
    return posts;
  }

  const headlineQuery = '.card h1';
  const dateQuery = '.card .date';
  const textQuery = '.card p:not(.date,.customer,originator)';

  const headline = fetchText(headlineQuery, $, elements);
  const dateTime = fetchText(dateQuery, $, elements);
  const date = dateTime.split('-')[0].trim();
  const text = fetchText(textQuery, $, elements);
  const location = data[1].split('~')[1];

  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const textInfo = `${date} , Text: ${location} : ${headline}`;
  const extraDataInfo = {
    Title: headline,
    Description: text,
    Date: date,
    Location: location,
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

export const parser = new LiteParser('Presse Portal', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.article-list article'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
