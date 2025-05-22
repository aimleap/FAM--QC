import moment from 'moment';
import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Ransomware Group',
  isCloudFlare: false,
  name: 'CiphBit Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://ciphbitqyg26jor7eeo6xieyq7reouctefrompp6ogvhqjba7uo4xdid.onion/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[class="row"]');
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
  const entrySelector = $('div[class="row"] div[class="post"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h2 a').text().trim();
    const date = $(el).find('h5:nth-of-type(1)').text().replace('post date,', '')
      .trim();
    const timestamp = moment.utc(date, 'MMMM DD, YYYY').unix();
    const articlefulltext = $(el).find('p').contents().text()
      .trim();

    posts.push(
      new Post(
        `${articlefulltext}\n${title}`,
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
            date,
            articlefulltext,
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
