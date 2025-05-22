import cheerio from 'cheerio';
import moment from 'moment';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Mikes Grand Store',
  type: SourceTypeEnum.FORUM,
  url: 'http://4yx2akutmkhwfgzlpdxiah7cknurw6vlddlq24fxa3r3ebophwgpvhyd.onion/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[id="wrapper"]');
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
  const entrySelector = $('div[class="product-small box "]').get().slice(1);
  entrySelector.forEach((el) => {
    const title = $(el)
      .find('p[class="name product-title woocommerce-loop-product__title"] a')
      .text()
      .trim();
    const price = $(el).find('span[class="woocommerce-Price-amount amount"]').text().trim();
    const articlefulltext = `${title} ${price}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articlefulltext}`,
        {
          current_url: source.url,
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
