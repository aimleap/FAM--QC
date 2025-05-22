import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.petromindo.com';
const baseURLSuffix = '/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('.highlight-title').text();
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

  const $el = $(elements);
  const date = $el.find('.meta-posted:eq(2)').text().split('WIB')[0].trim();
  if (moment(date, 'dddd, MMMM DD YYYY - hh:mma').isSame(moment(), 'day')) {
    const headlineQuery = 'h1.article-title';
    const textQuery = '.article-main .article-content';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);
    const timestamp = moment(date, 'dddd, MMMM DD YYYY - hh:mma').unix();
    const textInfo = `${headline} ; ${text}`;
    const extraDataInfo = {
      Headline: headline,
      Text: text,
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
  }
  return posts;
}

export const parser = new LiteParser(
  'Petromindo',
  baseURLPrefix,
  [
    {
      selector: ['.card-body article'],
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
