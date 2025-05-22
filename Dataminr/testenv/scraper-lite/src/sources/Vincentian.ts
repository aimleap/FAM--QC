import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://thevincentian.com/';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://thevincentian.com/index1.htm'; // Local
  const link2 = 'https://thevincentian.com/index92.htm'; // Politics
  const link3 = 'https://thevincentian.com/index93.htm'; // In The Courts
  const link4 = 'https://thevincentian.com/index94.htm'; // Business
  const urls = [link1, link2, link3, link4];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(page: Page, url: string): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) {
    return threads;
  }
  await page.waitForSelector('#MainContent', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$(
    '#MainContent table tbody tr h1.pageheading',
  );
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const text = await elementHandles[i].$eval('a', (node) => node.textContent);
    const href = await elementHandles[i].$eval('a', (anchor) => anchor.getAttribute('href'));
    threads.push({
      link: `${href}`,
      title: text?.toString().trim(),
      parserName: 'post',
    });
  }
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) {
    return posts;
  }
  await page.waitForSelector('.col-1', { visible: true });

  let dateText = await page.$eval('table tbody tr td .pageissuedate', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  dateText = dateText?.split(';')[1];
  const date = moment(dateText, 'dd, MMM DD, YYYY').format('MM/DD/YY');

  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;

  const title = await page.$eval('h1.pageheading', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('#divMain .pagebody > div', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: title,
    Date: date,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postedAt: timestamp,
      postUrl: url,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new PuppeteerParser('Vincentian', baseURL, [
  {
    parser: preThreadHandler,
  },
  {
    parser: threadHandler,
    name: 'thread',
  },
  {
    parser: postHandler,
    name: 'post',
  },
]);
