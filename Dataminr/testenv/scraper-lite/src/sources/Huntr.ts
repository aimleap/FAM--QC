import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://huntr.com';
const baseURLSuffix = '/bounties/hacktivity/';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('#hacktivity-page', { visible: true });
  /* eslint-disable no-await-in-loop */
  const elementHandles: ElementHandle[] = await page.$$('table#hacktivity-table tbody tr');
  for (let i = 0; i < elementHandles.length; i++) {
    const dateText = await elementHandles[i].$eval('.font-bold.leading-none  div span', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const date = moment(dateText, 'MMM Do YYYY').format('MM/DD/YYYY');
    if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return threads;
    const text = await elementHandles[i].$eval(
      '.font-bold.leading-none a',
      (node) => node.textContent,
    );
    const href = await elementHandles[i].$eval('.font-bold.leading-none a', (anchor) => anchor.getAttribute('href'));
    threads.push({
      link: `${href}`,
      title: `${text}~${date}`,
      parserName: 'post',
    });
  }
  return threads;
}

async function postHandler(page: Page, url: string, data: (string | null)[]): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  await page.waitForSelector('#write-up', { visible: true });

  const date = data[0]?.split('~')[1];
  const title = await page.$eval('h1#title', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const articleText = await page.$eval('#read-me-container #markdown', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const occurrences = await page.$eval('div.permalinkMD', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${title} ; ${articleText} ; ${occurrences}`;
  const extraDataInfo = {
    title,
    articleText,
    occurrences,
    date,
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
  'Huntr',
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
