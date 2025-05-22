import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.yorkshirepost.co.uk';
const baseURLSuffix = '/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const title = $el.find('h2').text();
    const href = $el.find('h2 > a').attr('href');
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
  const headlineQuery = '#content-wrapper h1';
  const textQuery = '#content-wrapper .article-content p';

  const title = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = $el.find('.sc-eELIPF .sc-hhgfTD:not(:contains(Update)) , .sc-hrZiYQ').text().split(',')[1]?.trim();

  const timestamp = moment(date, 'Do MMMM YYYY').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    discussion_title: title,
  };

  if (typeof date !== 'undefined' && moment(date, 'Do MMMM YYYY').isSame(moment(), 'day')) {
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
  'Yorkshire Post',
  baseURLPrefix,
  [
    {
      selector: ['#frameInner .article-item'],
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
