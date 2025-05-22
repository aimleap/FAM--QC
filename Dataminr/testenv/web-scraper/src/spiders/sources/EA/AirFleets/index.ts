import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: true,
  name: 'AirFleets 1',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.airfleets.net/divers/delivery.htm',
};

async function navigateToMainPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('tr[class="tabcontent"]');
}

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div[class="new-news-content"]');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const entryElements = $('tr[class="tabcontent"]').get();
  entryElements.forEach((el) => {
    const title = $(el).find('td:nth-child(1) a').text().trim();
    const link = `https://www.airfleets.net${$(el).find('td:nth-child(1) a').attr('href').slice(2)}`;
    const date = $(el).find('td:nth-child(5)').text().trim();
    const timestamp = moment.utc(date, 'DD/MM/YYYY').unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const pageElements = $('div[class="new-news-content"]');
  const text = $(pageElements).find('div[class="boxhome"] >  h1').text().trim();
  const airline = $(pageElements).find('div[class="boxhome"] h1').text().trim()
    .replace(text, '');
  const title = text.split(' - ')[0];
  const MSN = text.split(' - ')[1].split('  ')[0].split('MSN ')[1];
  const Registration = text.split('  ')[1];
  const rowCount = $(pageElements).find('tbody tr').get().length;
  const aircraftType = $(pageElements).find('tbody tr:nth-child(2) td:nth-child(2)').text().trim();
  const engineType = $(pageElements)
    .find(`tbody tr:nth-child(${rowCount - 1}) td:nth-child(2)`)
    .text()
    .trim();
  const deliveryDate = $(pageElements).find('tr[class="tabcontent"] td[width="15%"]:nth-child(2)').text().trim();
  const timestamp = moment.utc(deliveryDate, 'DD/MM/YYYY').unix();
  posts.push(
    new Post(
      `AIRCRAFT: ${title}; MSN: ${MSN}; REGISTRATION: ${Registration}; AIRLINE: ${airline}; DELIVERY DATE: ${deliveryDate}; AIRCRAFT TYPE: ${aircraftType}; ENGINE TYPE: ${engineType}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          MSN,
          Registration,
          airline,
          aircraftType,
          engineType,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new PuppeteerParserStealth(
  source,
  [
    {
      name: 'thread',
      parser: threadHandler,
    },
    {
      name: 'post',
      // @ts-ignore
      parser: postHandler,
    },
  ],
  1440,
  {
    ignoreDefaultArgs: ['--enable-automation'],
    ignoreHTTPSErrors: true,
  },
);
