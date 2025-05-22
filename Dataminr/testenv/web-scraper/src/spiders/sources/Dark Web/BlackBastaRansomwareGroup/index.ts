import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: true,
  name: 'Black Basta Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://stniiomyjliimcgkvdszvgen3eaaoz55hreqqx6o77yvmpwt7gklffqd.onion/',
  requestOption: {
    headers: {
      'Sec-WebSocket-Key': 'NHbltlKv+PoHPiE5BXn31g==',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      Upgrade: 'websocket',
      Cookie: 'token=ab9d0f89-00f3-410b-9ec0-681fafe59626',
      Connection: 'Upgrade',
      'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
    },
  },
};

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div[class="card"] + div[class="page-navigation"]');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function postHandler(page: Page): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const entrySelector = $('div[class="card"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('a[class="blog_name_link"]').text().trim();
    const link = $(el).find('a[class="blog_name_link"]').attr('href');
    const articlefulltext = $(el).find('div[class="vuepress-markdown-body"] p').text().trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articlefulltext}\n${title}`,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            dimain: title,
            title,
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
  {
    ignoreDefaultArgs: ['--enable-automation'],
    ignoreHTTPSErrors: true,
  },
);
