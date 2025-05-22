import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.kgns.tv';
const baseURLSuffix = '/news/local/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const link = $(el).find('.headline a.text-reset').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('.headline a.text-reset').attr('href');
      const headline = $(el).find('.deck').text();
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1';
  const articleFullTextQuery = '.article-body p.text:not(:has(a))';
  const title = fetchText(titleQuery, $, elements);
  const date = moment().format('MM/DD/YYYY');
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const articleInfo = `${title}; ${description}`;
  const extraDataInfo = {
    title,
    description,
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

export const parser = new LiteParser('KGNS', baseURLPrefix, [
  {
    selector: ['div.flex-feature'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
