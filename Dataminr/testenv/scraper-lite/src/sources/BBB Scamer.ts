import { Page } from 'puppeteer';
import moment from 'moment';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post } from '../lib/types';
import logger from '../lib/logger';

const URL = 'https://www.bbb.org/scamtracker';

async function getPosts(page: Page, rowNumber: number): Promise<Post[]> {
  const posts: Post[] = [];

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < rowNumber; i++) {
    try {
      await page.waitForSelector('div.scam_table', { visible: true });

      const elementHandle = (await page.$$('.scam_table tbody tr[id$="_scam"]'))[i];

      await elementHandle.focus();
      await elementHandle.hover();
      await elementHandle.click();

      await page.waitForSelector('div.scam_table', { hidden: true });

      const scamType = await page.$eval('p.scam_type', (node) => node.textContent);
      const scamId = await page.$eval('p.scam_id', (node) => node.textContent);
      const dateReported = await page.$eval('p.date_reported', (node) => node.textContent);
      const victimPostalCode = await page.$eval('p.postal_code', (node) => node.textContent);
      const totalDollarsLost = await page.$eval('p.dollars_lost', (node) => node.textContent);
      const scamDescription = await page.$eval('p.scam_description', (node) => node.textContent);
      const businessNameUsed = await page.$eval(
        'p.business_name',
        (node) => (node && node.textContent) || '',
      );

      const postedAt = moment.utc(dateReported, 'MMM DD, YYYY');
      const text = `Business Name Used: ${businessNameUsed} - Scam Description: ${scamDescription}`;

      posts.push(
        new Post({
          text,
          postedAt: postedAt.unix(),
          extraData: {
            Date: dateReported,
            'Scam Type': scamType,
            'Postal Code': victimPostalCode,
            'Dollars Lost': totalDollarsLost,
            'Scam ID': scamId,
            ingestType: 'INGEST_API',
            receivedTimestamp: postedAt.unix(),
            'Business Name Used': businessNameUsed,
            'Scam Description': scamDescription,
          },
        }),
      );

      const backToListButton = await page.$('a.back_to_list');

      await page.mouse.wheel({
        deltaY: -800,
      });

      if (backToListButton !== null) {
        await backToListButton.focus();
        await backToListButton.hover();
        await backToListButton.click();
      }

      await page.mouse.wheel({
        deltaY: 800,
      });

      /* eslint-enable no-await-in-loop */
    } catch (e) {
      logger.info('failed to parse BBB Scamer', e);
    }
  }

  return posts;
}

async function postHandler(page: Page): Promise<Post[]> {
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
  );
  await page.goto(`${URL}`);

  const $backdrop = await page.waitForSelector('.MuiBackdrop-invisible');

  $backdrop?.click();

  const $scamTable = await page.waitForSelector('.scam_table tbody tr[id$="_scam"]');
  if ($scamTable === null) return [];

  const posts: Post[] = [];

  let rowNumber = (await page.$$('.scam_table tbody tr[id$="_scam"]')).length;
  posts.push(...(await getPosts(page, rowNumber)));

  /* Click on next page */
  const nextButton = await page.$('.next_page.right.btn');

  if (nextButton !== null) {
    logger.info('navigate to next page');

    await nextButton.focus();
    await nextButton.click();

    rowNumber = (await page.$$('.scam_table tbody tr[id$="_scam"]')).length;
    posts.push(...(await getPosts(page, rowNumber)));
  }

  return posts;
}

export const parser = new PuppeteerParser('BBB Scam Tracker', URL, [
  {
    parser: postHandler,
    name: 'post',
  },
]);
