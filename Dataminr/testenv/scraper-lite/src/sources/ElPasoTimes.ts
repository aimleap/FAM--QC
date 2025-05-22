import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://www.elpasotimes.com';
const baseURLSuffix = '/news/';
async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  await page.waitForSelector('body .gnt_cw', { visible: true });
  /* eslint-disable no-await-in-loop */
  const elementHandles: ElementHandle[] = await page.$$('.gnt_pr > a, .gnt_m > a');
  for (let i = 0; i < elementHandles.length; i++) {
    const link = await elementHandles[i].evaluate((anchor) => anchor.getAttribute('href'));
    if (link?.includes(todaysDate) && !link.includes('/picture-gallery/') && !link.includes('/videos/')) {
      const text = await elementHandles[i].evaluate((node) => node.textContent);
      const href = await elementHandles[i].evaluate((anchor) => anchor.getAttribute('href'));
      threads.push({
        link: `${href}`,
        title: text?.toString().trim(),
        parserName: 'post',
      });
    }
  }
  return threads;
}
async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const todaysDate = moment().format('YYYY/MM/DD');
  await page.waitForSelector('main.gnt_cw', { visible: true });
  const title = await page.$eval('h1.gnt_ar_hl', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('article .gnt_ar_b', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(todaysDate, 'YYYY/MM/DD').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleText,
    date: todaysDate,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new PuppeteerParser(
  'El Paso Times',
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
