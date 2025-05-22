import moment from 'moment';
import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'Nemesis Market 3',
  type: SourceTypeEnum.FORUM,
  url: 'http://nemesis555nchzn2dogee6mlc7xxgeeshqirmh3yzn4lo5cnd4s5a4yd.onion/items/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[class="card-body ribbon ribbon-end py-0"]');
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
  const entrySelector = $('div[class="card-body ribbon ribbon-end py-0"]').get();
  entrySelector.forEach((el) => {
    const timestamp = moment().unix();
    const title = $(el).find('a[class="fs-4 text-hover-primary fw-bold"]').text().trim();
    const link = `http://nemesis555nchzn2dogee6mlc7xxgeeshqirmh3yzn4lo5cnd4s5a4yd.onion${$(el)
      .find('a[class="fs-4 text-hover-primary fw-bold"]')
      .attr('href')}`;
    let price = $(el)
      .find('div[class="d-flex flex-column mt-3"] div div')
      .map((_, ele) => $(ele).text().trim())
      .get()
      .join(' ');
    if (!price) {
      price = $(el).find('div[class="fs-4 text-gray-800 fw-bolder mt-3"]').text().trim();
    }
    posts.push(
      new Post(
        `${title}`,
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
