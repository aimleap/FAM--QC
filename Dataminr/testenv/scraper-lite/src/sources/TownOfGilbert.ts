import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.gilbertaz.gov';
const baseURLSuffix = '/departments/police/community-engagement/gilbert-police-news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.item-date').text().trim()
      .replace(/\n+/g, '')
      .replace(/\t+/g, '');
    if (moment(newsDate, 'MM/DD/YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = $el.find('h2 a').attr('href');
      const headline = $el.find('h2 a').text().replace(/\n+/g, '').replace(/\t+/g, '');
      threads.push({
        link: href,
        title: `${headline}~${newsDate}`,
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
  const dateQuery = '.detail-list-value';
  const textQuery = '.detail-content';

  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MM/DD/YYYY hh:mm a').unix();
  const textInfo = `${headline} ; ${text} ; ${date}`;

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
  'Town of Gilbert',
  baseURLPrefix,
  [
    {
      selector: ['ul.list-main li'],
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
