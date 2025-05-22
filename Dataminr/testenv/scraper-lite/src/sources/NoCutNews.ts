import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://nocutnews.co.kr';
const baseURLSuffix = '/news/list';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 10; index++) {
    preThreads.push({
      link: `${appendLink(baseURLPrefix, baseURLSuffix)}?page=${index}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY-MM-DD');
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  elements.forEach((el) => {
    const articleTextAndDate = $(el).find('dd.txt').text().trim();
    if (articleTextAndDate.includes(todaysDate)) {
      const href = $(el).find('dt>a').attr('href');
      const headline = $(el).find('dt>a').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const titleQuery = '.h_info h2';
  const dateQuery = '.h_info ul.bl_b li:not(.email)';
  const articleTextQuery = '#pnlContent';
  $(elements).find('.fr-img-wrap').remove();
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY-MM-DD hh:mm:ss').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm:ss').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
    Date: date,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('No Cut News', baseURLPrefix, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['#pnlNewsList ul li:has(dl)'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
