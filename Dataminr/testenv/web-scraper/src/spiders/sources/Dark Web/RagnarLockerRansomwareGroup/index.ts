/* eslint-disable no-undef */
import { Page } from 'puppeteer';
import moment from 'moment';
import cheerio from 'cheerio';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'RagnarLocker Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://rgleaktxuey67yrgspmhvtnrqtgogur35lwdrup4d3igtbm3pupc4lyd.onion/',
  expireIn: 200,
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[class="card"]');
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
  const entrySelector = $('div[class="card"]').get();
  entrySelector.forEach((el) => {
    const link = `http://rgleaktxuey67yrgspmhvtnrqtgogur35lwdrup4d3igtbm3pupc4lyd.onion/${$(el)
      .find('a')
      .attr('href')}`;
    const title = $(el).find('a').text().trim();
    const time = $(el).find('small').text().split(':')[1].trim();
    const timestamp = moment.utc(time, 'MM/DD/YYYY hh:mm:ss').unix();
    posts.push(
      new Post(
        `${title}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            entity: title,
            postUrl: link,
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
