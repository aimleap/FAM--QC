import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const UrlPrefix = 'https://www.nlrb.gov';
const UrlSuffix = '/news-publications/news/news-releases';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('table.views-table.case-decisions-table', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$(
    'table.views-table.case-decisions-table>tbody>tr',
  );
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const releasedate = await elementHandles[i].$eval('td', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const title = await elementHandles[i].$eval('td > a', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const href = await elementHandles[i].$eval("td>a[href^='/news-outreach']", (anchor) => anchor.getAttribute('href'));
    const formattedDate = moment(releasedate, 'MM/DD/YYYY');
    if (formattedDate.isSame(moment(), 'day')) {
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
  if (url === UrlPrefix + UrlSuffix) {
    return posts;
  }
  await page.waitForSelector('.field--name-title', { visible: true });
  const title = await page.$eval('.field--name-title', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  let date = await page.$eval('.field--name-node-post-date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  date = moment(date, 'LL').format('MM/DD/YY');
  const source = 'US National Labor Relations Board News';
  const additionalDataInfo = await page.$eval('.layout .field--name-body', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const timestamp = moment(date, 'LL').unix();
  const extraDataInfo = {
    'Additional Data': additionalDataInfo,
  };
  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}`;
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
  'US National Labor Relations Board News',
  UrlPrefix,
  [
    {
      parser: threadHandler,
    },
    {
      parser: postHandler,
      name: 'post',
    },
  ],
  UrlSuffix,
);
