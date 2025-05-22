import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseUrl = 'https://www.midiario.com/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.midiario.com/nacionales/';
  const link2 = 'https://www.midiario.com/policiales/';
  const urls = [link1, link2];
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
  if (url === baseUrl) {
    return threads;
  }
  await page.waitForSelector('#page-content', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$(
    '#page-content>.main-wrapper .main-box .featured div>a',
  );
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const date = await elementHandles[i].$eval(
      '.story-box-date,.story-photo-date',
      (node) => node.textContent,
    );
    const href = await (await elementHandles[i].getProperty('href')).jsonValue();
    const text = await elementHandles[i].$eval('h2', (node) => node.textContent);

    if (!date?.includes(' día')) {
      threads.push({
        link: `${href}`,
        title: `${text?.toString().trim()} - ${date}`,
        parserName: 'post',
      });
    }
  }
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseUrl) {
    return posts;
  }
  moment.locale('es-us');
  await page.waitForSelector('.article', { visible: true });

  let dateText = await page.$eval('.article-date', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  dateText = dateText?.split(': ')[1].trim();
  const date = moment(dateText, 'LLL').format('MM/DD/YY');

  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;

  await page.$eval('.article-content .mow', (el) => el.remove());
  const title = await page.$eval('article h1', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleText = await page.$eval('.article-content', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
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

export const parser = new PuppeteerParser('Mi Diario Panama', baseUrl, [
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
]);
