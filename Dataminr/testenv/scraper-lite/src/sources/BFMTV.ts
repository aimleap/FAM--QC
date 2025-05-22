import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.bfmtv.com';
const baseURLSuffix = '/paris/';
const todaysDate = moment().format('YYYYMMDD');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    if (href.includes(todaysDate)) {
      const headline = $el.find('.content_item_title').text();
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
  const headlineQuery = 'h1.content_title';
  const textQuery = '.chapo, .content_body_wrapper, .content_description_text';

  const headline = fetchText(headlineQuery, $, elements);
  const date = moment(todaysDate, 'YYYYMMDD').format('MM/DD/YYYY');
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const textInfo = `${headline}`;
  const extraDataInfo = {
    headline,
    text,
    date,
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
  'BFMTV',
  baseURLPrefix,
  [
    {
      selector: ['article.content_item'],
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
