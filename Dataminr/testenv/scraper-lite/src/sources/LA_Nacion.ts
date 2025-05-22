import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://lanacion.com.py/';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://lanacion.com.py/category/politica/'; // Politics
  const link2 = 'https://lanacion.com.py/category/pais/'; // Country
  const link3 = 'https://lanacion.com.py/category/negocios/'; // Business
  const urls = [link1, link2, link3];
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
  await page.waitForSelector('.section-body', { visible: true });
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < 3; i++) {
    const loadMoreButton = await page.$('.blm');
    await loadMoreButton?.click();
  }
  const elementHandles: ElementHandle[] = await page.$$('.ccol .cln .tc');
  for (let i = 0; i < elementHandles.length; i++) {
    await page.$eval('.cat', (el) => el.remove());
    const text = await elementHandles[i].$eval('h3', (node) => node.textContent);
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
  moment.locale('es');
  if (url === baseURL) {
    return posts;
  }
  await page.waitForSelector('article', { visible: true });

  const dateText = await page.$eval('article .bl .dt', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const date = moment(dateText, 'LL, h:mm').format('MM/DD/YY');

  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;

  const title = await page.$eval('.headline h1', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('.article-body .paragraph', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
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

export const parser = new PuppeteerParser('LA Nacion', baseURL, [
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
