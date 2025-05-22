import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://www.somaliland.com/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.somaliland.com/category/news/somaliland/';
  const link2 = 'https://www.somaliland.com/category/security/';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'threads',
    });
  }
  return preThreads;
}
async function threadHandler(page: Page, url: string): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) {
    return threads;
  }
  await page.waitForSelector('.container .main-left', { visible: true });
  /* eslint-disable no-await-in-loop */
  const elementHandles: ElementHandle[] = await page.$$('.main-left .post-design-content');
  for (let i = 0; i < elementHandles.length; i++) {
    await page.$eval('.main-left .post-design-content .post-meta a', (el) => el.remove());
    const dateText = await elementHandles[i].$eval('.post-meta', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YYYY');
    if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return threads;
    const text = await elementHandles[i].$eval('.post-content-area:not(.post-content-image) > a', (node) => node.textContent);
    const href = await elementHandles[i].$eval('.post-content-area:not(.post-content-image) > a', (anchor) => anchor.getAttribute('href'));
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
  if (url === baseURL) {
    return posts;
  }
  await page.waitForSelector('body .single-main', { visible: true });
  const date = data[1]?.split('~')[1];
  const title = await page.$eval('.page-title h1', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleFullText = await page.$eval('.post-content-area p', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'DD. MMMM YYYY hh:mm').unix();
  const articleInfo = `${articleFullText}`;
  const extraDataInfo = {
    discussion_title: title,
    Date: date,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postedAt: timestamp,
      postUrl: url,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new PuppeteerParser('Maanta Somaliland', baseURL, [
  {
    parser: preThreadHandler,
  },
  {
    parser: threadHandler,
    name: 'threads',
  },
  {
    parser: postHandler,
    name: 'post',
  },
]);
