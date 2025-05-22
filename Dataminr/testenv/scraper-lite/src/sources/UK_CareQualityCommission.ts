import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseUrlPrefix = 'https://www.cqc.org.uk';
const baseUrlSuffix = '/search/press-releases';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('.view-content', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$('.provider-services-list__list-item');
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const date = await elementHandles[i].$eval('.views-field-created', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    if (moment(date, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const title = await elementHandles[i].$eval('.views-field-title a', (node) => node.textContent?.trim().replace(/\n+/g, ''));
      const href = await elementHandles[i].$eval('.views-field-title a', (anchor) => anchor.getAttribute('href'));
      threads.push({
        link: `${href}`,
        title,
        parserName: 'post',
      });
    }
  }
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  await page.waitForSelector('.node__content', { visible: true });
  const content = await page.$eval('.cqc-widget-inner', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ' ').replace(/\s+/g, ' '));
  const date = await page.$eval('.node-created__date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const timestamp = moment(date, 'DD MMMM YYYY').unix();
  const textInfo = `${content}`;
  posts.push(
    new Post({
      text: textInfo,
      postedAt: timestamp,
      postUrl: url,
    }),
  );
  return posts;
}

export const parser = new PuppeteerParser(
  'UK Care Quality Commission',
  baseUrlPrefix,
  [
    {
      parser: threadHandler,
    },
    {
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
