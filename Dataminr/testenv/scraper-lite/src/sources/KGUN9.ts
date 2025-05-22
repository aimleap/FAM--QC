import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.kgun9.com/news/local-news';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURL}?00000166-7cf8-d240-adef-7df908700008-page=${index}`,
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
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.ListItem-date').text().trim();
    if (moment(articlePublishedDate, 'hh:mm a, MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a.ListItem').attr('href');
      const title = $(el).find('h3.ListItem-title').text();
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
  if (url === baseURL) return [];
  const titleQuery = 'h1.ArticlePage-headline';
  const dateQuery = '.published';
  const articleTextQuery = '.ArticlePage-articleBody';
  $(elements).find('.accent').remove();
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'hh:mm a, MMM DD, YYYY').format('MM/DD/YYYY hh:mm a');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm a').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleText,
    Date: dateText,
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

export const parser = new LiteParser('KGUN 9', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['ul.List-items>li.List-items-row>div.List-items-row-item'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['.ArticlePage-mainContent'],
    parser: postHandler,
    name: 'post',
  },
]);
