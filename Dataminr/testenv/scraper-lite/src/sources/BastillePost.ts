import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://www.bastillepost.com';
const baseURLSuffix = '/hongkong/category/3-%E7%A4%BE%E6%9C%83%E4%BA%8B';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];

  await page.waitForSelector('#main .article-list', { visible: true });

  let showMoreButton = null;

  /* eslint-disable no-await-in-loop */

  do {
    await page.mouse.wheel({ deltaY: 5000 });

    try {
      showMoreButton = await page.waitForSelector('.load-more-wrapper button', {
        timeout: 1000,
        visible: true,
      });
    } catch (e) {
      showMoreButton = null;
    }
  } while (showMoreButton === null);

  const elementHandles: ElementHandle[] = await page.$$('.article-list article');
  for (let i = 0; i < elementHandles.length; i++) {
    const text = await elementHandles[i].$eval('h3 a', (node) => node.textContent);
    const href = await elementHandles[i].$eval('h3 a', (anchor) => anchor.getAttribute('href'));
    threads.push({
      link: `${href}`,
      title: text?.toString().trim(),
      parserName: 'post',
    });
  }
  /* eslint-enable no-await-in-loop */
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  await page.waitForSelector('.single-article', { visible: true });

  const dateText = await page.$eval('.article-heading time', (anchor) => anchor.getAttribute('datetime'));
  const date = moment(dateText, 'YYYY-MM-DD hh:mm:ss').format('MM/DD/YY hh:mm:ss');

  if (!moment(date, 'MM/DD/YY hh:mm:ss').isSame(moment(), 'day')) return posts;

  const title = await page.$eval('.article-heading h1', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('.single-article > p, .div-continue-content > p', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'MM/DD/YY hh:mm:ss').unix();
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
  'Bastille Post',
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
