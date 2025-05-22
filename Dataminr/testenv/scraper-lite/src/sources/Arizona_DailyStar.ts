import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://tucson.com';
const baseURLSuffix = '/news/local/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.tnt-headline a').attr('href');
    const headline = $(el).find('.tnt-headline a').text().replace(/\n+/g, ' ')
      .trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const $el = $(elements);
  const date = $el.find('.visible-print time').attr('datetime')?.split('T')[0];
  if (!moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) return posts;
  const titleQuery = 'h1.headline';
  const articleFullTextQuery = '#article-body p';
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Arizona Daily Star',
  baseURLPrefix,
  [
    {
      selector: ['article.tnt-asset-type-article'],
      parser: threadHandler,
    },
    {
      selector: ['article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
