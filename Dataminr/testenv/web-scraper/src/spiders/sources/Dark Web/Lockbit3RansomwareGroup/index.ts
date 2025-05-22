import Puppeteer from 'scraper-lite/dist/lib/puppeteer';
import moment from 'moment';
import cheerio from 'cheerio';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import Post from '../../../../schema/post';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { DUMMY_SITE } from '../../../parsers/Parser';
import logger from '../../../../lib/logger';

interface ParserOutput {
  selector: CheerioSelector;
  url: string;
}
// mirror domains
const urls = ['http://lockbit3753ekiocyo5epmpy6klmejchjtzddoekjlnt6mu3qh4de2id.onion/'];

const puppeteerSpecs = {
  sleepTime: 2 * 60 * 1000, // 2 min
  launchOptions: {
    timeout: 60000, // default is 30000 ms
    headless: process.env.NODE_ENV !== 'development',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--proxy-server=socks5://127.0.0.1:7000',
    ],
  },
};

const puppeteerInstance = new Puppeteer(puppeteerSpecs);

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'LockBit 3.0 Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: DUMMY_SITE,
  expireIn: 200,
};

async function navigatePage(page: any) {
  await page.waitForSelector('div.post-big-list', { visible: true });
}

async function parsePage(page: any, url: string): Promise<ParserOutput | null> {
  const content = await page.content();
  await page.close();
  return { selector: cheerio.load(content), url };
}

async function parsePages(url: string): Promise<ParserOutput | null> {
  logger.info(`Getting new Puppeteer page for Lockbit mirror url ${url}`);
  try {
    const page = await puppeteerInstance.getNewPage();
    await page.goto(url);
    await navigatePage(page);
    return parsePage(page, url);
  } catch (e) {
    logger.info(`Failed to parse page for Lockbit mirror ${url}`, e);
    return null;
  }
}

async function postHandler(): Promise<Post[]> {
  const posts: Post[] = [];

  const outputs = await Promise.all(urls.map((url) => parsePages(url)));

  outputs.forEach((output) => {
    if (output === null || output.selector === null) return;
    const entrySelector = output.selector('a.post-block.bad').get();
    entrySelector.forEach((el) => {
      const $el = output.selector(el);
      const message = $el.find('div[class="post-block-text"]').text().trim();
      const profileName = $el.find('div[class="post-title"]').text().trim();
      const link = `${output.url.replace('.onion/', '.onion')}${$el.attr('href').trim()}`;
      const rawTimestamp = $el
        .find('div.updated-post-date span')
        .text()
        .replace('Updated:', '')
        .trim();
      const timestamp = adjustTimezone(
        moment.utc(rawTimestamp, 'DD MMM YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
        TIME_ZONE.UTC,
      );
      posts.push(
        new Post(
          message,
          {
            current_url: link,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: profileName,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
              linkdedup: 'true',
            }),
          ),
        ),
      );
    });
  });

  return posts;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
