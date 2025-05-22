import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://www.primerahora.com';
const baseURLSuffix = '/noticias/';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.primerahora.com/noticias/puerto-rico/';
  const link2 = 'https://www.primerahora.com/noticias/policia-tribunales/';
  const link3 = 'https://www.primerahora.com/noticias/gobierno-politica/';
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
  await page.waitForSelector('.StoryList .ListItemTeaser', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$('.StoryList .ListItemTeaser');
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const dateText = await elementHandles[i].$eval('.ListItemTeaser__date', (node) => node.textContent?.trim());
    const date = moment(dateText, 'DD / MMM / YYYY').format('MM/DD/YY');
    if (moment(date, 'MM/DD/YY').isSame(moment(), 'day')) {
      const title = await elementHandles[i].$eval('.ListItemTeaser__column a h3', (node) => node.textContent?.trim().replace(/\n+/g, ''));
      const href = await elementHandles[i].$eval('.ListItemTeaser__column a', (anchor) => anchor.getAttribute('href'));
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
  moment.locale('es');
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  await page.waitForSelector('.ArticleContent', { visible: true });
  const title = await page.$eval('h1.ArticleHeadline_head', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const dateText = await page.$eval('.ArticleContent .ArticleDateTime', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  let date = dateText?.split('•')[0].trim();
  date = moment(date, 'LL').format('MM/DD/YY');
  const text = await page.$eval('.u-section--noticias .ArticleBody > p', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, '').replace(/\s+/g, ' '));
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    discussion_title: title,
    Date: date,
  };
  posts.push(
    new Post({
      text: textInfo,
      postedAt: timestamp,
      postUrl: url,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new PuppeteerParser(
  'Primera Hora PR',
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
