import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.journaldumali.com';
const baseURLSuffix = '/category/politique/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a h1.post-title,h2.post-title,h3.title').text();
      threads.push({
        link: href,
        title: `${todaysDate}~${headline}`,
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

  const headlineQuery = 'h1.title';
  const textQuery = '.post-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const date = data[0].split('~')[0];
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'YYYY/MM/DD').unix();
  const textInfo = text;
  const extraDataInfo = {
    Headline: headline,
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
  'Journal du Mali',
  baseURLPrefix,
  [
    {
      selector: ['.main .container .column-left article'],
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
