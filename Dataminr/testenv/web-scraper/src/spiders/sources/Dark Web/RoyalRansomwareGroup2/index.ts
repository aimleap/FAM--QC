import { Page } from 'puppeteer';
import moment from 'moment';
import cheerio from 'cheerio';
import { Post } from 'scraper-lite/dist/lib/types';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Malicious Forum',
  isCloudFlare: false,
  name: 'Royal Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://royal4ezp7xrbakkus3oofjw6gszrohpodmdnfbe5e4w3og5sm7vb3qd.onion/',
  expireIn: 200,
};

async function scrollPage(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        // eslint-disable-next-line no-undef
        window.scrollBy(0, distance);
        const scrollHeight = 6000;
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function navigatePage(page: Page) {
  await page.waitForSelector('div.post', { visible: true });
  await scrollPage(page);
}

async function parsePage(page: Page): Promise<CheerioSelector | null> {
  const content = await page.content();
  return cheerio.load(content);
}

async function postHandler(page: Page): Promise<Post[]> {
  const posts: Post[] = [];

  await navigatePage(page);

  const $ = await parsePage(page);

  if ($ === null) return [];

  const entrySelector = $('div.post').get();

  entrySelector.forEach((el) => {
    const $el = $(el);
    const message = $el
      .find('main p')
      .contents()
      .text()
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
    const profileName = $el.find('div[class="card"]').text().trim();
    const link = $el.find('div ul li a').attr('href');
    const time = $el
      .find('div[class="time"]')
      .text()
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();

    if (message === '' || time === '') return;

    const timestamp = moment.utc(time, 'DD MMMM YYYY').unix();

    posts.push(
      new Post({
        text: message,
        postedAt: timestamp,
        postUrl: source.url,
        extraData: {
          entityUrl: link,
          entity: profileName,
          ingestpurpose: 'mdsbackup',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        },
      }),
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
