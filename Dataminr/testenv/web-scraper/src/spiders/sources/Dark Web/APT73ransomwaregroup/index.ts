import moment from 'moment';
import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Ransoware Leaks Site',
  isCloudFlare: false,
  name: 'APT73 ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://wn6vonooq6fggjdgyocp7bioykmfjket7sbp47cwhgubvowwd7ws5pyd.onion/',
};

async function navigateToPage(page: Page) {
  await page.goto(`${source.url}`);
  await page.waitForSelector('div[class*="segment "]');
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
  const entrySelector = $('div[class="segment "]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="segment__text__off"]').text().trim();
    const articlefulltext = $(el).find('div[class="segment__text__dsc"]').text().trim();

    const time = $(el).find('div[class="segment__date__deadline"]').text().trim();
    const timestamp = moment().unix();
    const text = `${title};${articlefulltext}`;
    posts.push(
      new Post(
        text,
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
            articlefulltext,
            deadline: time,
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
