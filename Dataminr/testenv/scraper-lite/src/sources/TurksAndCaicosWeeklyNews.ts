import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseUrl = 'https://tcweeklynews.com/';
async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('.mid-wrapper', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$(
    '.mid-wrapper .main-content h1.pageheading',
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
  await page.waitForSelector('.main-content', { visible: true });

  let dateText = await page.$eval('.pageissuedate', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  dateText = dateText?.split(';')[1].trim();
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YY');

  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;

  const title = await page.$eval('#divMain h1.pageheading', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('#divMain > div.pagebody.layout_pagebody > div', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
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

export const parser = new PuppeteerParser('Turks and Caicos Weekly News', baseUrl, [
  {
    parser: threadHandler,
  },
  {
    parser: postHandler,
    name: 'post',
  },
]);
