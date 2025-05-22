/* eslint-disable no-undef */
import { Page } from 'puppeteer';
import moment from 'moment';
import cheerio from 'cheerio';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: '0Day Today 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://sq542reyqwagfkghieehykb6hh6ohku5irarrrbeeo5iyozdbhe5n3id.onion/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('input[type="submit"]');
  await page.click('input[type="submit"]');
  await page.waitForSelector('div[class="search_block"]');
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
  const entrySelector = $('div[class="ExploitTableContent"]').get();
  entrySelector.forEach((el) => {
    const date = $(el).find('a[href*="date"]').text().trim();
    const description = $(el).find('h3 a').text().trim();
    const type = $(el).find('div[class="td"]:nth-of-type(3) a').text().trim();
    const hits = $(el).find('div[class="td"]:nth-of-type(4)').text().trim();
    const gold = $(el)
      .find('div:nth-child(10)')
      .contents()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .slice(0, 4)
      .trim();
    const author = $(el).find('a[href*="author"]').text().trim();
    const timestamp = moment.utc(date, 'DD-MM-YYYY').unix();
    posts.push(
      new Post(
        `${description}\n${source.url}\n${author}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: description,
            title: description,
            date,
            description,
            type,
            hits,
            gold,
            author,
            articlefulltext: description,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
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
