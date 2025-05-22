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
  name: 'BlackByte Ransomware Group 5',
  type: SourceTypeEnum.FORUM,
  url: 'http://jbeg2dct2zhku6c2vwnpxtm2psnjo2xnqvvpoiiwr5hxnc6wrp3uhnad.onion/',
  expireIn: 200,
};

async function navigateToPage(page: Page) {
  await page.goto(`${source.url}`);
  await page.waitForSelector('ul[id="pagination1"]');
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
  const entrySelector = $('table[class="table table-bordered table-content "]').get();
  entrySelector.forEach((el) => {
    const $el = $(el);
    const title = $el.find('h1').text().trim();
    const articletext = $el.find('p[class="description"]').contents().text().trim();
    const domain = $el.find('a[class*="website"]').attr('href');
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}: ${articletext}`,
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
            domain,
            articlefulltext: articletext,
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
