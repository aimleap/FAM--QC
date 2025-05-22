import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.hindustantimes.com';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let i = 1; i <= 5; i++) {
    preThreads.push({
      link: `https://www.hindustantimes.com/india-news/page-${i}`,
      parserName: 'threads',
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
  if (url === baseURL) return threads;
  elements.forEach((el) => {
    const articleDate = $(el).find('div.dateTime').text().split('on')[1].replace('IST', '').trim();
    if (moment(articleDate, 'MMM DD, YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = $(el).find('h3.hdg3>a').attr('href');
      const headline = $(el).find('h3.hdg3').text().trim();
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
  if (url === baseURL) return posts;
  const titleQuery = 'h1.hdg1';
  const dateQuery = 'div.dateTime';
  const articleFullTextQuery = '.storyDetails .detail>p';
  const dateText = fetchText(dateQuery, $, elements).split('on')[1].replace('IST', '').trim();
  const date = moment(dateText, 'MMM DD, YYYY hh:mm a').format('MM/DD/YYYY hh:mm a');
  if (!moment(date, 'MM/DD/YYYY hh:mm a').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMMM DD, YYYY hh:mm a').unix();
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

export const parser = new LiteParser('Hindustan Times', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.listingPage div.cartHolder'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['.mainContainer'],
    parser: postHandler,
    name: 'post',
  },
]);
