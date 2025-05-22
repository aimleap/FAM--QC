import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.drps.ca';
const baseURLSuffix = '/news/?search=&category=Media%20Releases';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('.h5 a').attr('href');
    const headline = $el.find('.h5 a').text();
    threads.push({
      link: href,
      title: headline,
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
  const dateTimeQuery = '.post__meta';
  const date = fetchText(dateTimeQuery, $, elements);
  if (moment(date, 'DD MMMM YYYY').isSame(moment(), 'day')) {
    const headlineQuery = 'h1';
    const textQuery = '.post__body p';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(date, 'DD MMMM YYYY').unix();
    const textInfo = `${headline} ; ${date} ; ${text}`;
    const extraDataInfo = {
      headline,
      date,
      text,
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
  'Durham Regional Police',
  baseURLPrefix,
  [
    {
      selector: ['div.box-wrap > div'],
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
