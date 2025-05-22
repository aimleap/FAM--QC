import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://sarasotapolice.prod.govaccess.org';
const baseURLSuffix = '/about-us/news-list';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.item-date').text();
    if (moment(newsDate, 'MM/DD/YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = $el.find('h2 a').attr('href');
      const headline = $el.find('h2 a').text();
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

  const headlineQuery = 'h2.detail-title';
  const dateTimeQuery = '.detail-list-value';
  const textQuery = '.detail-content';

  const headline = fetchText(headlineQuery, $, elements);
  const dateTime = fetchText(dateTimeQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(dateTime, 'MM/DD/YYYY hh:mm a').unix();
  const textInfo = `${headline} ; ${text} ; ${dateTime}`;

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Police Department of Sarasota FL',
  baseURLPrefix,
  [
    {
      selector: ['.list-main li'],
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
