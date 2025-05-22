import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.wktv.com';
const baseURLSuffix = '/news/local/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.card-date time').attr('datetime').split('T')[0];
    if (moment(newsDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $el.find('h3.tnt-headline a').attr('href');
      const description = $el.find('.card-lead p').text();
      threads.push({
        link: href,
        title: description,
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const $el = $(elements);
  const headlineQuery = 'h1.headline';
  const textQuery = '#article-body > p';

  const headline = fetchText(headlineQuery, $, elements);
  const description = data[0];
  const date = $el.find('li.visible-print time').attr('datetime').split('T')[0];
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const textInfo = `${headline} ; ${description}`;
  const extraDataInfo = {
    headline,
    description,
    text,
    ingestpurpose: 'mdsbackup',
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
  'WKTV',
  baseURLPrefix,
  [
    {
      selector: ['article .card-container'],
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
