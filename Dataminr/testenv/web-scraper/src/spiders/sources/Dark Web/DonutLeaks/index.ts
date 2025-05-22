import cheerio from 'cheerio';
import moment from 'moment';
import { Page } from 'puppeteer';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Donut Leaks',
  type: SourceTypeEnum.FORUM,
  url: 'http://sbc2zv2qnz5vubwtx3aobfpkeao6l4igjegm3xx7tk5suqhjkp5jxtqd.onion/',
};

async function navigateToMainPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div[class="box post-box"]');
}

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('main[id="content"]');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const entryElements = $('div[class="box post-box"]').get();
  entryElements.forEach((el) => {
    const title = $(el).find('h2 a').text();
    const author = $(el).find('a[href*="author"]').text().trim();
    const link = `http://sbc2zv2qnz5vubwtx3aobfpkeao6l4igjegm3xx7tk5suqhjkp5jxtqd.onion${$(el).find('h2 a').attr('href')}`;
    const date = $(el).find('time').attr('datetime');
    const timestamp = moment.utc(date, 'DD-MM-YYYY').unix();
    threads.push({
      title: `${title} ${author}`,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(page: Page, url: String): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const entryElements = $('section[class="page-wrapper"]').get();
  entryElements.forEach((el: any) => {
    const title = $(el).find('pz').text().trim();
    const articletext = $(el)
      .find('section[class="post-content"] p')
      .contents()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r|\t)/gm, '');
    const files = $(el).find('a[class="kg-btn kg-btn-accent"]').attr('href');
    const domain = $(el).find('section[class="post-content"] a').attr('href');
    const timestamp = moment().unix();
    posts.push(new Post(
      `${articletext}\n${title}`,
      {
        current_url: `${url}`,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          title,
          entity: title,
          domain,
          files,
          articlefulltext: articletext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new PuppeteerParserStealth(
  source,
  [
    {
      name: 'thread',
      parser: threadHandler,
    },
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
