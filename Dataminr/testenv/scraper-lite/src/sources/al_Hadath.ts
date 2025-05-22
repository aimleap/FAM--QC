import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.alhadath.net';
const baseURLSuffix = '/yemen?cref=navdesk';

const todaysDate = moment().format('YYYY/MM/DD');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('a').attr('href');
    if (link.includes(todaysDate)) {
      const href = encodeURI($el.find('a').attr('href'));
      const headline = $el.find('a .ttl').text();
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

  const $el = $(elements);
  const headlineQuery = '.article-hdr h1';
  const textQuery = '#body-text';

  const headline = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = $el.find('.article-hdr time').attr('datetime');

  const timestamp = moment(date, 'DD-MM-YYYY').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    Date: date,
    discussion_title: headline,
  };
  const decodedURL = decodeURI(url);

  posts.push(
    new Post({
      text: textInfo,
      postUrl: decodedURL,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'al - Hadath',
  baseURLPrefix,
  [
    {
      selector: ['.news ul li, .area-75 .news-articles ul li'],
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
