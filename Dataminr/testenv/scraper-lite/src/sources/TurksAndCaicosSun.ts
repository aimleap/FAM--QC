import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseUrl = 'https://suntci.com/';
async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('.left_div', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$(
    '.left_div #c3 div[id^="heading_H1"],.left_div #c3 div[id^="heading_H2"]',
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
  await page.waitForSelector('.maincontent_div', { visible: true });

  let dateText = await page.$eval('#date_DEF .pageissuedate', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  dateText = dateText?.split(';')[1].trim();
  const date = moment(dateText, 'dd, MMM DD, YYYY').format('MM/DD/YY');

  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;

  const title = await page.$eval('.heading_DEF h1.pageheading', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('#body_wrapper_DEF #body_DEF', (node) => node.textContent?.trim().replace(/\n+/g, ''));
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

export const parser = new PuppeteerParser('Turks and Caicos Sun', baseUrl, [
  {
    parser: threadHandler,
  },
  {
    parser: postHandler,
    name: 'post',
  },
]);
