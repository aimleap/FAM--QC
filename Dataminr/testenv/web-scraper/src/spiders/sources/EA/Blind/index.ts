import cheerio from 'cheerio';
import moment from 'moment';
import { parseTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import { Page } from 'puppeteer';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'Blind',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.teamblind.com/?sort=pop',
};

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div.max-w-full.flex-1');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(): Promise<ThreadType[]> {
  return [
    {
      title: 'teamblind-recent',
      link: 'https://www.teamblind.com/?sort=id',
      parserName: 'post',
      timestamp: moment().unix(),
    },
  ];
}

async function postHandler(page: Page): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  if ($ === null) return [];
  const entrySelector = $('div[data-testid="article-preview-card"]').get();
  entrySelector.forEach((el) => {
    const employer = $(el).find('div[class*=" text-xs text-gray-800"] a').attr('title');
    const industry = $(el).find('a[data-testid="article-preview-channel"]').text().trim();
    const time = $(el)
      .find('span[class="text-xs text-gray-600"]')
      .text()
      .trim()
      .replace('m', ' minutes ago')
      .replace('h', ' hours ago');
    const timestamp = parseTimestamp(time);
    const title = $(el).find('a[data-testid="article-preview-title"]').text().trim();
    const link = `https://www.teamblind.com${$(el)
      .find('a[data-testid="article-preview-title"]')
      .attr('href')}`.trim();
    const text = $(el).find('p').text().trim();
    posts.push(
      new Post(
        `${title} ; ${text}`,
        {
          current_url: link, // Use the first URL or any other logic as needed
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            employer,
            trending: 'false',
            industry,
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
