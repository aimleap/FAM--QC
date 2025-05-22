import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'http://isuharghita.ro';
const baseURLSuffix = '/index.php/stiri';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('body #main', { visible: true });
  /* eslint-disable no-await-in-loop */
  const elementHandles: ElementHandle[] = await page.$$('tbody tr');
  for (let i = 0; i < elementHandles.length; i++) {
    const titleText = await elementHandles[i].$eval('.list-title', (node) => node.textContent);
    const href = await elementHandles[i].$eval('.list-title a', (anchor) => anchor.getAttribute('href'));
    threads.push({
      link: `${href}`,
      title: titleText?.toString().trim(),
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
  await page.waitForSelector('.row #content', { visible: true });

  const dateText = await page.$eval('.published', (node) => node.textContent?.split(':')[1].trim());
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YY');
  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;
  const title = await page.$eval('.page-header', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('.item-page p', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
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

export const parser = new PuppeteerParser(
  'Harghita Fire Department',
  baseURLPrefix,
  [
    {
      parser: threadHandler,
    },
    {
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
