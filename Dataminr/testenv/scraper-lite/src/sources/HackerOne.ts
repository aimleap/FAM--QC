import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://hackerone.com/hacktivity/overview';
async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('#page-content', { visible: true });
  /* eslint-disable no-await-in-loop */
  await page.$eval(
    '.TableCell-module_u1-table__row__ruxUO.TableCell-module_u1-table__row--inert__QMjwE',
    (el) => el.remove(),
  );
  const elementHandles: ElementHandle[] = await page.$$(
    '#page-content div.Table-module_u1-table__table__XXGYP > div.Table-module_u1-table__table__XXGYP.Table-module_u1-table__grid__GFaF->div.TableCell-module_u1-table__row__ruxUO',
  );
  for (let i = 0; i < elementHandles.length; i++) {
    const title = await elementHandles[i].$eval(
      'a.daisy-link.routerlink',
      (node) => node.textContent,
    );
    const href = await elementHandles[i].$eval('a.daisy-link.routerlink', (anchor) => anchor.getAttribute('href'));
    const reportID = href?.split('/')[2];
    threads.push({
      link: `https://hackerone.com/reports/${reportID}.json`,
      title: title?.toString().trim(),
      parserName: 'post',
    });
  }
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const preTag = await page.$eval('pre', (node) => node.textContent);
  const jsonObject = JSON.parse(preTag!);
  const disclosedDate = jsonObject.disclosed_at;
  const date = disclosedDate.split('T')[0];
  if (!moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) return posts;
  const { title } = jsonObject;
  let summary = jsonObject.vulnerability_information.replace(/\n+/g, '');
  if (summary.length === 0) {
    summary = jsonObject.summaries[0].content;
  }
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const newsInfo = `${title} ; ${summary}`;
  const extraDataInfo = {
    title,
    summary,
    Date: date,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postedAt: timestamp,
      postUrl: url.replace('.json', ''),
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new PuppeteerParser('HackerOne', baseURL, [
  {
    parser: threadHandler,
    name: 'threads',
  },
  {
    parser: postHandler,
    name: 'post',
  },
]);
