import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: '0x00sec',
  type: SourceTypeEnum.FORUM,
  url: 'https://0x00sec.org/',
};

async function navigateToMainPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('tr[data-topic-id]');
}

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div[class="container posts"]');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const entryElements = $('tr[data-topic-id]').get();
  entryElements.forEach((el) => {
    const title = $(el).find('span[class="link-top-line"] a').text().trim();
    const link = `https://0x00sec.org${$(el).find('span[class="link-top-line"] a').attr('href')}`;
    const timestamp = Number($(el).find('span[class="relative-date"]').attr('data-time'));
    if (!Number.isNaN(timestamp)) {
      threads.push({
        title,
        link,
        parserName: 'post',
        timestamp,
        requestOption: {
          headers: {
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          },
        },
      });
    }
  });
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const entryElements = $('article[id="post_1"]').get();
  const pageElements = $('div[id="main-outlet"]');
  const title = $(pageElements).find('a[class="fancy-title"]').text().trim();
  const tags = $(pageElements)
    .find('div[class="topic-category ember-view"] span[class="category-name"]')
    .text()
    .trim();
  entryElements.forEach((el: any) => {
    const description = $(el)
      .find('div[class="cooked"]')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const date = $(el).find('a[title="Post date"] span').attr('title');
    const timestamp = Number($(el).find('a[title="Post date"] span').attr('data-time'));
    const text = `${title};${date};${tags};${description}`;
    posts.push(
      new Post(
        text,
        {
          current_url: `${url}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            time: date,
            tags,
            description,
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
    ignoreHTTPSErrors: true,
  },
);
