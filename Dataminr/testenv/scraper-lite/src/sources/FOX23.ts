import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.fox23.com';
const baseURLSuffix = '/news/local/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('h4.tnt-headline a').attr('href');
    const title = $el.find('h4.tnt-headline').text();
    threads.push({
      link: href,
      title,
      parserName: 'post',
    });
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
  const date = $el.find('li.visible-print time').attr('datetime').split('T')[0];
  if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    const headlineQuery = 'h1.headline';
    const textQuery = '#article-body > p';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(date, 'YYYY-MM-DD').unix();
    const textInfo = `${headline}`;
    const extraDataInfo = {
      headline,
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
  }
  return posts;
}

export const parser = new LiteParser(
  'Fox 23',
  baseURLPrefix,
  [
    {
      selector: ['.block.light .card-grid article'],
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
