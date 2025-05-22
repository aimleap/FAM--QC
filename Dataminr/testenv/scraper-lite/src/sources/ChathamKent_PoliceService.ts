import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://ckpolice.com';
const baseURLSuffix = '/category/daily-news-release/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('time').text();
    if (moment(newsDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h3.entry-title a').attr('href');
      const headline = $el.find('h3.entry-title a').text();
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const headlineQuery = 'h1.entry-title';
  const dateTimeQuery = 'time.entry-date';
  const textQuery = '.entry-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateTimeQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const textInfo = `${headline} ; ${date} ; ${text}`;
  const extraDataInfo = {
    headline,
    date,
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
  'Chatham-Kent Police Service',
  baseURLPrefix,
  [
    {
      selector: ['.content article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
