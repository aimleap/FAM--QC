import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.houstontx.gov/police/';
const baseURLSuffix = 'news.htm';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('td:eq(0)').text();
    if (moment(articlePublishedDate, 'MM-DD-YY').isSame(moment(), 'day')) {
      const href = $(el).find('td:eq(1) a').attr('href');
      const title = $(el).find('td:eq(1) a').text().trim();
      threads.push({
        link: href,
        title,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = '.pageTitle';
  const dateQuery = '.pageTitle+div span.contBold';
  const articleFullTextQuery = '.pageTitle+div';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${articleFullText}`;
  const extraDataInfo = {
    title,
    date,
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

export const parser = new LiteParser('Houston Fire and Police 911', baseURLPrefix, [
  {
    selector: ['table tbody tr:not(:has(th))'],
    parser: threadHandler,
  },
  {
    selector: ['#main .container'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
