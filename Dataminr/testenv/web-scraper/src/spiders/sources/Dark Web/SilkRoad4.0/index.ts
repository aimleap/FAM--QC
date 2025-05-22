import moment from 'moment';
import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'General Marketplace',
  isCloudFlare: true,
  name: 'Silk Road 4.0',
  type: SourceTypeEnum.FORUM,
  url: 'http://silkr4lawr2zanmaqfbcpdtmybjmk2m6lu3iv5iw7jyivyz2cgt2xgid.onion/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[class="col-md-2 col-sm-2 col-lg-2 col-xs-6"]');
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
  const entrySelector = $('div[class="col-md-2 col-sm-2 col-lg-2 col-xs-6"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="product-description"] a').text().trim();
    const link = $(el).find('div[class="product-description"] a').attr('href');
    const price = $(el).find('span[class="price"] del+span').text().trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        title,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            price,
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
