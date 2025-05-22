import moment from 'moment';
import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: true,
  name: '4PDA Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://4pda.to/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('article[class="post ufjEON"]');
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
  const entrySelector = $('article[class="post ufjEON"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('span[itemprop="name"]').text().trim();
    const articletext = $(el).find('div[itemprop="description"] p').text().trim();
    const date = $(el).find('meta[itemprop="datePublished"]').attr('content');
    const timestamp = moment.utc(date).unix();
    posts.push(
      new Post(
        `${articletext}\n${title}`,
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
            articlefulltext: articletext,
            ingestpurpose: 'deepweb',
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
