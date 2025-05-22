import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://horseedmedia.net';
const baseURLSuffix = '/category/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = moment($(el).find('.entry-date').text(), 'MMMM DD, YYYY').format('MM/DD/YY');
    if (moment(date, 'MM/DD/YY').isSame(moment(), 'day')) {
      const href = $(el).find('h2.entry-title a').attr('href');
      const headline = $(el).find('h2.entry-title').text();
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
  const dateQuery = '.entry-date';
  const textQuery = '.entry-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    discussion_title: headline,
    Date: date,
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
  'Horseed Media',
  baseURLPrefix,
  [
    {
      selector: ['.site-main article'],
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
