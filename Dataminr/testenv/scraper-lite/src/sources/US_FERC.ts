import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

async function threadHandler(page: Page): Promise<Thread[]> {
  const threads: Thread[] = [];
  const elementHandle = await page.$$('#submit');
  await elementHandle[0].click();
  await page.waitForSelector('#tblRslt', { visible: true });
  const elementHandles: ElementHandle[] = await page.$$('#tblRslt > tbody > tr');
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < elementHandles.length; i++) {
    const accession = await elementHandles[i].$eval(
      'td:nth-child(2) > div > button',
      (node) => node.textContent,
    );
    const date = await elementHandles[i].$eval(
      'td:nth-child(3) > span',
      (node) => node.textContent,
    );
    const formattedDate = moment(date, 'MM/DD/YYYY');
    if (formattedDate.isSame(moment(), 'day')) {
      threads.push({
        link: `eLibrarywebapi/api/Document/GetDocInfoFromP8/${accession?.trim()}`,
        parserName: 'post',
      });
    }
  }
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  if (url.indexOf('GetDocInfoFromP8') !== -1) {
    const htmlContent = await page.content();
    const content = htmlContent
      .replace('<html><head></head><body>', '')
      .replace('</body></html>', '');
    try {
      const jsonObj = JSON.parse(content);
      const category = jsonObj?.DataList[0]?.Category;
      const filed = moment(jsonObj?.DataList[0]?.Filed_Date).format('MM/DD/YYYY');
      const document = moment(jsonObj?.DataList[0]?.Document_Date).format('MM/DD/YYYY');
      const docket = `${jsonObj?.DataList[0]?.eLcDocket[0]?.Docket_Number}-${jsonObj?.DataList[0]?.eLcDocket[0]?.SubDocket_Number}`;
      const description = jsonObj?.DataList[0]?.Description;
      const posted = moment(jsonObj?.DataList[0]?.Posted_Date).format('MM/DD/YYYY');
      const library = jsonObj?.DataList[0]?.Library.join(',');
      const docClass = jsonObj?.DataList[0]?.eLcClassType[0]?.Class;
      const docType = jsonObj?.DataList[0]?.eLcClassType[0]?.Type;
      let roleOrg = '';
      jsonObj?.DataList[0]?.eLcAffiliation.forEach((element: any) => {
        roleOrg = roleOrg + (roleOrg !== '' ? ',' : '') + element.Affiliation_Organization;
      });
      posts.push(
        new Post({
          text: `Title: FERC Disclosure; Description: ${description}; Date: ${filed}; Source: US FERC; Entities Mentioned: ${roleOrg}; Type: ${docClass}; Additional Data: Category: ${category}; Document: ${document}; Docket: ${docket}; Filed: ${filed}; Library: ${library}; Document Type: ${docType}`,
          postedAt: moment(posted, 'MM/DD/YYYY').unix(),
          postUrl: url,
          extraData: {
            Title: 'FERC Disclosure; Description',
            Description: description,
            Date: filed,
            Source: 'US FERC',
            'Entities Mentioned': roleOrg,
            Type: docClass,
            'Additional Data': `${category}; ${document}; ${docket}; ${filed}; ${library}; ${docClass}`,
          },
        }),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
  return posts;
}

export const parser = new PuppeteerParser(
  'US_FERC',
  'https://elibrary.ferc.gov/',
  [
    {
      parser: threadHandler,
    },
    {
      parser: postHandler,
      name: 'post',
    },
  ],
  '/eLibrary/search',
);
