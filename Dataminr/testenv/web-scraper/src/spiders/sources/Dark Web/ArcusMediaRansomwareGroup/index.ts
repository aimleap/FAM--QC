import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Ransomeware',
  isCloudFlare: true,
  name: 'Arcus Media ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://arcuufpr5xxbbkin4mlidt7itmr6znlppk63jbtkeguuhszmc5g7qdyd.onion/',
};

async function navigateToMainPage(page: Page) {
  await delay(1000);
  await page.waitForSelector('div[class="card-content"]');
}

async function navigateToPostPage(page: Page) {
  await delay(1000);
  await page.waitForSelector('div[id="content"]');
}

async function parsePage(page: Page) {
  const content = await page.content();
  return cheerio.load(content);
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const entryElements = $('div[class="card-content"]').get();
  entryElements.forEach((el) => {
    const link1 = $(el).find('h2 a').attr('href');
    if (link1) {
      const title = $(el).find('h2 a').text().trim();
      const link = $(el).find('h2 a').attr('href');
      const time = $(el).find('time[class*="published"]').attr('datetime');
      const timestamp = moment(time).unix();
      if (!Number.isNaN(timestamp)) {
        threads.push({
          title,
          link,
          parserName: 'post',
          timestamp,
        });
      }
    }
  });
  return threads;
}

async function postHandler(page: Page, url: string): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const entryElements = $('div[id="content"]').get();
  entryElements.forEach((el: any) => {
    const title = $(el).find('h1').text().trim();
    const description = $(el)
      .find('div[class*="yuki-article-content yuki-entry-content"]')
      .text()
      .trim();
    const date = $(el).find('time[class*="published"]').attr('datetime');
    const selldateRaw = $(el).find('p mark:nth-of-type(1)').text().split('LEAK')[0];
    const leakdateRaw = $(el).find('p mark:nth-of-type(1)').text().split('LEAK')[1];
    const selldate = selldateRaw === undefined ? '' : selldateRaw.replace('EST', '').trim().split(':')[1];
    const leakdate = leakdateRaw === undefined ? '' : leakdateRaw.replace('EST', '').trim().split(':')[1];
    let domain = $(el)
      .find('div[class*="yuki-article-content yuki-entry-content"] p:nth-of-type(1)')
      .text()
      .split(' ')[0]
      .trim();
    domain = (domain.includes('.com') || domain.includes('.gov') || domain.includes('http'))
      && domain.length < 30
      ? domain
      : '';
    const timestamp = moment(date).unix();
    const text = `${title};${description}`;
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
            entity: title,
            domain,
            selldate,
            leakdate,
            articlefulltext: description,
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
