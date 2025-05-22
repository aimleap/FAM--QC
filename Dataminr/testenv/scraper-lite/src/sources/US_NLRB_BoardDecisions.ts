import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const baseUrlPrefix = 'https://www.nlrb.gov';
const baseUrlSuffix = '/cases-decisions/decisions/board-decisions';
async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  await page.waitForSelector('table.views-table.case-decisions-table', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$(
    'table.views-table.case-decisions-table>tbody>tr',
  );
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const date = await elementHandles[i].$eval('td', (node) => node.textContent);
    const href = await elementHandles[i].$eval("td>a[href^='/case']", (anchor) => anchor.getAttribute('href'));
    const formattedDate = moment(date, 'MM/DD/YYYY');
    if (formattedDate.isSame(moment(), 'day')) {
      threads.push({
        link: `${href}`,
        title: date?.toString().trim(),
        parserName: 'post',
      });
    }
  }
  return threads;
}

async function postHandler(page: Page, url: string, data: (string | null)[]): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  await page.waitForSelector('h1.page-title', { visible: true });
  const caseName = await page.$eval('h1.page-title', (node) => node.textContent?.trim());
  const issuanceDate = moment(data[0], 'MM/DD/YYYY').format('MM/DD/YY');
  const source = 'US National Labor Relations Board Decisions';
  await page.waitForSelector('.left-div', { visible: true });
  const leftDivInfo = await page.$eval('.display-flex>div', (node) => node.textContent?.replace(/\n+/g, '').trim());
  const status = leftDivInfo?.split(':')[3].trim();
  const caseNumber = leftDivInfo?.split(':')[1].replace('Date Filed', '').trim();
  const rightDivInfo = await page.$eval('.display-flex>div+div', (node) => node.textContent?.replace(/\n+/g, '').trim());
  const regionAssigned = rightDivInfo?.split(':')[2].trim();
  const elementHandles: ElementHandle[] = await page.$$('.docket-activity-table>tbody>tr');
  const document = await elementHandles[0].$eval('td:nth-child(2)', (element) => element.textContent?.replace(/\n+/g, '').trim());
  const issuedFiledBy = await elementHandles[0].$eval('td:nth-child(3)', (element) => element.textContent?.replace(/\n+/g, '').trim());
  const timestamp = moment(issuanceDate, 'MM/DD/YY').unix();

  const boardDecisionsInfo = `Title: ${caseName}, Date: ${issuanceDate}, Source: ${source}`;
  const additionalDataInfo = `Status: ${status}; Region Assigned: ${regionAssigned}; Document: ${document}; Issued/Filed By: ${issuedFiledBy}; Case Number: ${caseNumber}`;
  const extraDataInfo = {
    'Additional Data': additionalDataInfo,
  };

  posts.push(
    new Post({
      text: boardDecisionsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new PuppeteerParser(
  'US National Labor Relations Board Decisions',
  baseUrlPrefix,
  [
    {
      parser: threadHandler,
    },
    {
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
