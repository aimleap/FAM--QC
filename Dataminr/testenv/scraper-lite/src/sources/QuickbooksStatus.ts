import moment from 'moment';
import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post } from '../lib/types';

const baseURL = 'https://status.quickbooks.intuit.com/';
async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  await page.waitForSelector('.container', { visible: true });
  /* eslint-disable no-await-in-loop */
  const todaysDate = moment().format('MMM DD, YYYY');
  const timestamp = moment(todaysDate, 'MMM DD, YYYY').unix();
  const mainStatus = await page.$eval('.page-status, .container .unresolved-incident', (node) => node.textContent?.replace(/\n+/g, '').trim());
  if (mainStatus === 'All Systems Working') {
    return posts;
  }
  let pastIncidents = '';
  const pastIncidentsList: ElementHandle[] = await page.$$('.incidents-list .status-day');
  for (let i = 0; i < pastIncidentsList.length; i++) {
    const incidentInfo = await pastIncidentsList[i].evaluate(
      (el) => el.textContent,
      pastIncidentsList[i],
    );
    if (incidentInfo?.includes(todaysDate)) {
      pastIncidents = incidentInfo.replace(/\n+/g, '').trim();
    }
  }
  const countryNames = [];
  const countryElementHandles: ElementHandle[] = await page.$$(
    'body .container table.newComponentTable thead tr td',
  );
  for (let i = 0; i < countryElementHandles.length; i++) {
    const temp = await countryElementHandles[i].evaluate(
      (el) => el.textContent,
      countryElementHandles[i],
    );
    countryNames.push(temp);
  }
  const elementHandles: ElementHandle[] = await page.$$(
    'body .container table.newComponentTable tbody tr',
  );
  for (let i = 0; i < elementHandles.length; i++) {
    let serviceName;
    let country;
    const tdTags: ElementHandle[] = await elementHandles[i].$$('td');
    for (let j = 0; j < tdTags.length; j++) {
      let serviceInfo = '';
      if (j === 0) {
        serviceName = await tdTags[j].evaluate((el) => el.textContent, tdTags[j]);
      }
      let statusCheck;
      if (j !== 0) {
        country = countryNames[j];
        const spanElement = await tdTags[j].$('span');
        const className = await (await spanElement?.getProperty('className'))?.jsonValue();
        if (className?.includes('fa-check')) {
          statusCheck = 'All Systems Working';
        } else if (className?.includes('fa-minus-square')) {
          statusCheck = 'Things are slower than normal';
        } else if (className?.includes('fa-exclamation-triangle')) {
          statusCheck = 'Minor Interruption of service';
        } else if (className?.includes('fa-times')) {
          statusCheck = 'Major Interruption of service';
        } else if (className?.includes('status-blue')) {
          statusCheck = 'Planned System Maintenance';
        } else {
          statusCheck = '';
        }
      }
      /* eslint-disable no-await-in-loop */
      serviceInfo = `Main Status: ${mainStatus} ; Service: ${serviceName} ${country} ${statusCheck}`;
      const extraDataInfo = {
        'Main Status': mainStatus
          ?.replace(/\t+/g, '')
          .replace(/\n+/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
        serviceName,
        country,
        Status: statusCheck,
        Date: todaysDate,
        'Past Incidents': pastIncidents,
      };
      if (j > 0 && statusCheck !== 'All Systems Working' && statusCheck !== '') {
        posts.push(
          new Post({
            text: serviceInfo,
            postUrl: url,
            postedAt: timestamp,
            extraData: extraDataInfo,
          }),
        );
      }
    }
  }
  return posts;
}

export const parser = new PuppeteerParser('Quickbooks Status', baseURL, [
  {
    parser: postHandler,
    name: 'post',
  },
]);
