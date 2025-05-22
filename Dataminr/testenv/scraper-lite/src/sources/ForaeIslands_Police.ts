import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://politi.fo';
const baseURLSuffix = '/tidindilisti?';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('#page-content', { visible: true });
  /* eslint-disable no-await-in-loop */
  const elementHandles: ElementHandle[] = await page.$$('.newsResult');
  for (let i = 0; i < elementHandles.length; i++) {
    const dateText = await elementHandles[i].$eval('.newsResultInfo .newsDate', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const date = moment(dateText, 'DD. MMMM YYYY').format('MM/DD/YY');
    if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return threads;

    const text = await elementHandles[i].$eval('h6.newsResultTitle', (node) => node.textContent);
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  await page.waitForSelector('#page-content', { visible: true });

  const date = await page.$eval('div.newsInfo > p:nth-child(3)', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const title = await page.$eval('.row h1', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('.newsArticle .rich-text', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'DD. MMMM YYYY hh:mm').unix();
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

export const parser = new PuppeteerParser(
  'Forae Islands Police',
  baseURLPrefix,
  [
    {
      parser: threadHandler,
      name: 'thread',
    },
    {
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
