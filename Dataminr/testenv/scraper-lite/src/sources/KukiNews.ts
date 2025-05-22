import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.kukinews.com';
const baseURLSuffix = '/newsList/kuk001000000,kuk003000000';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('span.artDate').text().trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD hh:mm').isSame(moment(), 'day')) {
      const href = $(el).attr('href');
      const headline = $(el).find('.sbj').text();
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
  const titleQuery = 'h1.view-title';
  const dateQuery = '.info .date';
  const articleTextQuery = '#article';
  $(elements).find('figure').remove();
  const dateText = fetchText(dateQuery, $, elements).replace('기사승인', '').trim();
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

export const parser = new LiteParser('Kuki News', baseURLPrefix, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.headline .txt a, article.row>a'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
