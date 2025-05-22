import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://www.elnuevodia.com';
const baseURLSuffix = '/noticias/';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.elnuevodia.com/noticias/locales/';
  const link2 = 'https://www.elnuevodia.com/noticias/seguridad/';
  const link3 = 'https://www.elnuevodia.com/noticias/tribunales/';
  const urls = [link1, link2, link3];
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return threads;
  }
  await page.waitForSelector('.story-listing .ListItemTeaser', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$('.story-listing .ListItemTeaser');
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const title = await elementHandles[i].$eval('h1.story-tease-title', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const href = await elementHandles[i].$eval('h1.story-tease-title a', (anchor) => anchor.getAttribute('href'));
    threads.push({
      link: `${href}`,
      title,
      parserName: 'post',
    });
  }
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  moment.locale('es');
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  await page.waitForSelector('.content-container', { visible: true });
  const title = await page.$eval('.article-header h1.title', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const dateText = await page.$eval('.item-date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  let date = dateText?.split('-')[0].trim();
  date = moment(date, 'dddd LL').format('MM/DD/YY');
  const text = await page.$eval('.article-body p.content-element', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const extraDataInfo = {
    discussion_title: title,
    Date: date,
  };
  const textInfo = `${text}`;
  if (moment(date, 'MM/DD/YY').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: textInfo,
        postedAt: timestamp,
        postUrl: url,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new PuppeteerParser(
  'El Nuevo Dia PR',
  baseURLPrefix,
  [
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
  ],
  baseURLSuffix,
);
