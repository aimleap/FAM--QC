import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseUrl = 'https://www.prensa.com/';
async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('.main-box', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$(
    '.main-box .main-box-block .main-box-left .story-box h2',
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
  if (url === baseUrl) {
    return posts;
  }
  const dateText = await page.$eval('.article-date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const date = moment(dateText, 'DD MMM YYYY - hh:mm a').format('MM/DD/YY');

  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;

  const title = await page.$eval('.article-header h1', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('.article-content', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: title,
    Date: dateText,
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

export const parser = new PuppeteerParser('La Prensa Panama', baseUrl, [
  {
    parser: threadHandler,
  },
  {
    parser: postHandler,
    name: 'post',
  },
]);
