import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://wmbdradio.com';
const baseURLSuffix = '/news/';
const todaysDate = moment().format('YYYY/MM/DD');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const link = $(el).attr('href');
    if (link.includes(todaysDate)) {
      const href = $el.attr('href');
      const description = $el.find('.text').text();
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
  const headlineQuery = 'h1.entry-title';
  const dateQuery = '.post-date';
  const textQuery = '.mainArticle p';

  const headline = fetchText(headlineQuery, $, elements);
  const description = data[0];
  const date = fetchText(dateQuery, $, elements);
  const formattedDate = moment(date, 'MMM DD, YYYY | hh:mm a').format('MM/DD/YYYY hh:mm');
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(formattedDate, 'MM/DD/YYYY hh:mm').unix();
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
  '1470 WMBD',
  baseURLPrefix,
  [
    {
      selector: ['.posts a'],
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
