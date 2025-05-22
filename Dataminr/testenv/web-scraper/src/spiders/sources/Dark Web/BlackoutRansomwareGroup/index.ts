import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Blackout Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion/',
};

async function navigateToMainPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div.card');
}

async function navigateToPostPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('div.d-flex.flex-row');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const entryElements = $('div.card').get();
  entryElements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = `http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion${$(el)
      .find('a')
      .attr('href')}`;
    const timestamp = moment().unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const pageElements = $('div.d-flex.flex-row');
  const title = $(pageElements).find('h2').text().trim();
  const articlefulltext = $(pageElements)
    .find('h2+p')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const size = $(pageElements)
    .find('p.text-danger')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const date = $(pageElements)
    .find('div p.text-uppercase span')
    .text()
    .trim()
    .replace('Uploaded: ', '');
  const timestamp = moment(date, 'DD MMM, YYYY hh:mm:ss ZZZ').unix();
  posts.push(
    new Post(
      `Title- ${title}; text: ${articlefulltext}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          articlefulltext,
          size,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
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
