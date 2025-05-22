import cheerio from 'cheerio';
import moment from 'moment';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Leaks Site',
  isCloudFlare: false,
  name: 'Bahira Finance',
  type: SourceTypeEnum.FORUM,
  url: 'http://bahiravhv47srmpkeiqrnijvwsfdbdjwwzwweiasxllfsvjzduncwhad.onion/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[id="main"] div[class="row"] table[id="sample-table-1"]');
  await page.click('ul[class="nav nav-pills flex-column "] li[data-page="dumps.php"]');
  await page.waitForSelector('div[class="cardoption"]');
  await delay(2000);
}

async function parsePage(page: Page): Promise<CheerioSelector | null> {
  const content = await page.content();
  return cheerio.load(content);
}

async function postHandler(page: Page): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPage(page);
  const $ = await parsePage(page);
  if ($ === null) return [];
  const entrySelector = $('div[class="cardoption"] tr').get();
  entrySelector.forEach((el) => {
    const rawCardType = $(el).find('td center img').attr('src');
    const cardType = rawCardType === undefined ? '' : rawCardType.split('/images/')[1].split('.')[0];
    const number = $(el).find('td:nth-of-type(2)').text().trim();
    const type = $(el).find('td:nth-of-type(3)').text();
    const level = $(el).find('td:nth-of-type(4)').text().trim();
    const class1 = $(el).find('td:nth-of-type(5)').text().trim();
    const timestamp = moment().unix();
    const code = $(el).find('td:nth-of-type(6)').text().trim();
    const expDate = $(el).find('td:nth-of-type(7)').text().trim();
    const base = $(el).find('td:nth-of-type(8)').text().trim();
    const country = $(el).find('td:nth-of-type(9)').text().trim();
    const state = $(el).find('td:nth-of-type(10)').text().trim();
    const bank = $(el).find('td:nth-of-type(11)').text().trim();
    const t1 = $(el).find('td:nth-of-type(12)').text().trim();
    const action = $(el).find('td:nth-of-type(13) button').text().trim();
    const isNumber = !Number.isNaN(Number(number));
    if (isNumber) {
      posts.push(
        new Post(
          `${number}\n${type}\n${level}\n${class1}`,
          {
            current_url: source.url,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: number,
              number,
              type: cardType,
              level,
              class: class1,
              code,
              expDate,
              base,
              country,
              state,
              bank,
              t1,
              action,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return posts;
}
export const parser = new PuppeteerParserStealth(
  source,
  [
    {
      name: 'post',
      // @ts-ignore
      parser: postHandler,
    },
  ],
  1440,
);
