import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'http://www.rodong.rep.kp/ko/';
const baseURLSuffix = 'index.php?MkBAMkAxQA==';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('.container .container', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$('.container .container .row');
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const dateText = await elementHandles[i].$eval('.news_date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const postDate = moment(dateText, 'YYYY.MM.DD.').format('MM/DD/YY');
    if (moment(postDate, 'MM/DD/YY').isSame(moment(), 'day')) {
      const href = await elementHandles[i].$eval('.media-body a', (anchor) => anchor.getAttribute('href'));
      const headline = await elementHandles[i].$eval('.media-body a', (node) => node.textContent?.trim().replace(/\n+/g, ''));
      threads.push({
        link: `${href}`,
        title: headline,
        parserName: 'post',
      });
    }
  }
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  await page.waitForSelector('#news_contents', { visible: true });
  const title = await page.$eval('.news_Title', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const date = await page.$eval('.NewsDate', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const body = await page.$eval('.ArticleContent', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const pageType = 'Main Articles';
  const timestamp = moment(date, 'YYYY.MM.DD.').unix();
  const articleInfo = `Date: ${date}, Title: ${title}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
    Page: pageType,
    Body: body,
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

export const parser = new PuppeteerParser(
  'Rodong Sinmun',
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
