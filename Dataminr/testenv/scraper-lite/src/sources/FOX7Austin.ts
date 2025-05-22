import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.fox7austin.com';
const baseURLSuffix = '/news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text();
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
  const titleQuery = 'h1.headline';
  const dateQuery = '.article-date>time';
  const articleFullTextQuery = '.article-body>p:not(:has(strong))';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MMMM DD, YYYY hh:mma').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMMM DD, YYYY hh:mma').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser('FOX 7 Austin', baseURLPrefix, [
  {
    selector: ['.main-content article .info h3 a'],
    parser: threadHandler,
  },
  {
    selector: ['.main-content>article'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
