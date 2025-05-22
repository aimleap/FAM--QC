import moment from 'moment';
import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';
import Logger from '../../../../lib/logger';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'RALord ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://ralordqe33mpufkpsr6zkdatktlu3t2uei4ught3sitxgtzfmqmbsuyd.onion/',
};

async function navigateToThreadPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('*');
}

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('body');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  await navigateToThreadPage(page);
  const $ = await parsePage(page);
  const items: ThreadType[] = [];
  const seenlinks = new Set<string>();

  // Solve captcha if exists
  const captchaText = $('span[id="captchaQuestion"]').text().replace('=', '').trim();

  if (captchaText) {
    try {
      // eslint-disable-next-line
      const answer = eval(captchaText); // Trusted math expression like "2 + 3"
      if (typeof answer === 'number' && !Number.isNaN(answer)) {
        await page.type('input[id="captchaInput"]', answer.toString());
        await page.click('button[class="captcha-submit"]');
        await delay(Math.random() * 1000);
      }
    } catch (err) {
      Logger.info('Captcha solve error:', err);
    }
  }

  // Re-parse page after captcha
  const $$ = await parsePage(page);
  const elements = $$('div[class="posts"] article').get();
  elements.forEach((el) => {
    const link = $(el).find('a').attr('href');
    if (!seenlinks.has(link)) {
      seenlinks.add(link);
      const title = $(el).find('a').text().replace(/\s+/g, ' ')
        .trim();
      const times = $(el).find('p[class="post-date"]').text().trim();
      const timestamp = moment.utc(times, 'MMMM DD, YYYY').unix();
      const links = source.url + link;
      items.push({
        title,
        link: links,
        timestamp,
        parserName: 'post',
      });
    }
  });
  return items;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const items: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const domain = $('h1').first().text()
    .replace(/\s+/g, ' ');
  const times = $('div[class="post-meta"] span').first().text()
    .split(':')[1];
  const timestamp = moment.utc(times, 'MMMM DD, YYYY').unix();
  if (domain) {
    items.push(
      new Post(
        `${domain}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            domain,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  }
  return items;
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
