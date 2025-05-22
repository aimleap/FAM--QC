import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://www.fnnews.com';
const baseURLSuffix = '/section/001001006';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('.wrap_artlist', { visible: true });
  /* eslint-disable no-await-in-loop */
  const elementHandles: ElementHandle[] = await page.$$('.inner_artlist ul li');
  for (let i = 0; i < elementHandles.length; i++) {
    const dateText = await elementHandles[i].$eval('.date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const date = moment(dateText, 'YYYY-MM-DD hh:mm:ss').format('MM/DD/YY');
    if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return threads;
    const text = await elementHandles[i].$eval('h3.tit_thumb', (node) => node.textContent);
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
  await page.waitForSelector('#root', { visible: true });
  await page.$eval('.wrap_left #taboola-below-article-thumbnails', (el) => el.remove());
  await page.$eval('.wrap_left #ad_pitPc', (el) => el.remove());
  await page.$eval('#newsStandArea .wrap_stand', (el) => el.remove());
  await page.$eval('.wrap_left .box_img', (el) => el.remove());
  await page.$eval('.wrap_left #hotNewsArea', (el) => el.remove());
  await page.$eval('p.art_copyright', (el) => el.remove());
  await page.$eval('.pc_add07 script', (el) => el.remove());
  const date = await page.$eval('div.byline > em:nth-child(2)', (node) => node.textContent?.split('입력')[1].trim().replace(/\n+/g, ''));
  const title = await page.$eval('h1.tit_view', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('.wrap_left #article_content', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'YYYY.MM.DD hh:mm').unix();
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
  'Financial News',
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
