import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'http://www.rodong.rep.kp/ko/';
const baseURLSuffix = 'index.php?MUBAMUAxQA==';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('.container .row', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$('.row #NewsListDIV ul li');
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const dateText = await elementHandles[i].$eval('.news_date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
    const postDate = moment(dateText, 'YYYY.MM.DD.').format('MM/DD/YY');
    if (moment(postDate, 'MM/DD/YY').isSame(moment(), 'day')) {
      const href = await elementHandles[i].$eval('a', (anchor) => anchor.getAttribute('href'));
      const headline = await elementHandles[i].$eval('a', (node) => node.textContent?.trim().replace(/\n+/g, ''));
      threads.push({
        link: `${href}`,
        title: `${headline}#${postDate}`,
        parserName: 'post',
      });
    }
  }
  return threads;
}

async function postHandler(page: Page, url: string, data: (string | null)[]): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  await page.waitForSelector('.container .row', { visible: true });
  const title = await page.$eval('.news_Title', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const date = data[0]?.split('#')[1];
  const body = await page.$eval('.ArticleContent', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const pageType = 'Revolutionary Activities';
  const timestamp = moment(date, 'MM/DD/YY').unix();
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
  'Rodong Sinmun RA',
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
