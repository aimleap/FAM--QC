import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://politi.dk';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://politi.dk/nyhedsliste';
  const link2 = 'https://politi.dk/bornholms-politi';
  const link3 = 'https://politi.dk/nyhedsliste?district=Fyns-Politi';
  const link4 = 'https://politi.dk/nordjyllands-politi';
  const link5 = 'https://politi.dk/nordsjaellands-politi';
  const link6 = 'https://politi.dk/nyhedsliste?district=Syd-og-Soenderjyllands-Politi';
  const link7 = 'https://politi.dk/doegnrapporter?district=Sydsjaellands-og-Lolland-Falsters-Politi';
  const link8 = 'https://politi.dk/koebenhavns-vestegns-politi';
  const urls = [link1, link2, link3, link4, link5, link6, link7, link8];
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
  if (url === baseURL) {
    return threads;
  }
  await page.waitForSelector('#page-content, section.PressMessagesPreview', { visible: true });
  /* eslint-disable no-await-in-loop */
  const elementHandles: ElementHandle[] = await page.$$('.newsResult, div.PressMessagePreview');
  for (let i = 0; i < elementHandles.length; i++) {
    const dateText = await elementHandles[i].$eval(
      '.newsResultInfo .newsDate, div.PressMessagePreviewHeader > p:nth-child(1)',
      (node) => node.textContent?.trim().replace(/\n+/g, ''),
    );
    const date = moment(dateText, 'DD. MMMM YYYY').format('MM/DD/YYYY');
    if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return threads;
    const text = await elementHandles[i].$eval(
      'h6.newsResultTitle, a>h6.h6-police-bold',
      (node) => node.textContent,
    );
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
  if (url === baseURL) {
    return posts;
  }
  await page.waitForSelector('#page-content', { visible: true });
  const date = await page.$eval('div.newsInfo > p:nth-child(3)', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const responders = await page.$eval('div.newsInfo h6', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const title = await page.$eval('.row h1', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const description = await page.$eval('.newsArticle h4', (node) => node.textContent?.trim().replace(/\n+/g, ''));
  const articleFullText = await page.$eval('.newsArticle .rich-text', (node) => node.textContent?.trim().replace(/\n+/g, '').replace(/\t+/g, ''));
  const timestamp = moment(date, 'DD. MMMM YYYY hh:mm').unix();
  const articleInfo = `${date}; ${responders}; ${title}; ${description}`;
  const extraDataInfo = {
    date,
    responders,
    title,
    description,
    articleFullText,
    ingestpurpose: 'mdsbackup',
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

export const parser = new PuppeteerParser('Danish Police', baseURL, [
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
