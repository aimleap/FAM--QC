import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://protectpwc.org';
const baseURLSuffix = '/public-letters-legislation/public-letters/';
const todaysDate = moment().format('YYYY/MM/DD');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    if (href.includes(todaysDate)) {
      const headline = $el.find('a').text();
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
  const textQuery = '.entry-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(todaysDate, 'YYYY/MM/DD').unix();
  const textInfo = `Post URL: ${url} ; Post Text: ${headline} ${text}`;
  const extraDataInfo = {
    Headline: headline,
    Text: text,
    Date: todaysDate,
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
  'Coalition to Protect Prince William County',
  baseURLPrefix,
  [
    {
      selector: ['.entry-container ul li'],
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
