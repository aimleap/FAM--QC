import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'Best Webmaster Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://babia.to',
};

async function navigateToMainPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div.forumStats-main.forumStats-shown');
}

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div.p-body-pageContent');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const entryElements = $('div[class="node-extra"]').get();
  entryElements.forEach((el) => {
    const title = $(el).find('a[class="node-extra-title"]').attr('title');
    const link = `${source.url}${$(el).find('a[class="node-extra-title"]').attr('href')}`;
    const timestamp = Number($(el).find('time').attr('data-time'));
    if (!Number.isNaN(timestamp)) {
      threads.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
  });
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const parts = source.url.split('/');
  const id = parts[parts.length - 1];
  const entryElements = $(`article[data-content=${id}]`).get();
  const pageElements = $('div[id="top"]');
  const title = $(pageElements).find('h1[class="p-title-value"]').text().trim();
  entryElements.forEach((el: any) => {
    const articlefulltext = $(el)
      .find('div[class="bbWrapper"]')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = Number($(el).find('time').attr('data-time'));
    const text = `${articlefulltext} - ${title}`;
    posts.push(
      new Post(
        text,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            articlefulltext,
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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
);
