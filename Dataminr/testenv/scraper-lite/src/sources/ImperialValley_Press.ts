import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.ivpressonline.com';
const baseURLSuffix = '/news/local/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.card-date time').attr('datetime')?.split('T')[0];
    if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.tnt-headline a').attr('href');
      const description = $(el).find('.card-lead').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const $el = $(elements);
  const date = $el.find('.visible-print time').attr('datetime')?.split('T')[0];
  const titleQuery = 'h1.headline';
  const articleFullTextQuery = '#article-body p';
  const title = fetchText(titleQuery, $, elements);
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const articleInfo = `${title} ; ${description}`;
  const extraDataInfo = {
    title,
    description,
    articleFullText,
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
  'Imperial Valley Press',
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
