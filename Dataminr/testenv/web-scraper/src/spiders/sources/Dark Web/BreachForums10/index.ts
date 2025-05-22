import cheerio from 'cheerio';
import moment from 'moment';
import { Page } from 'puppeteer';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'Breach Forums 10',
  type: SourceTypeEnum.FORUM,
  url: 'http://breachedu76kdyavc6szj6ppbplfqoz3pgrk3zw57my4vybgblpfeayd.onion/',
  requestOption: {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    },
  },
};

async function navigateToMainPage(page: Page) {
  await delay(Math.random() * 1000);
  await page.waitForSelector('td[class="trow1 forums__last-post"]');
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
  const entryElements = $('td[class="trow1 forums__last-post"]').get();
  entryElements.forEach((el) => {
    let time = '';
    const title = $(el).find('a:nth-child(1)').attr('title');
    const link = `${source.url}${$(el).find('a:nth-child(1)').attr('href')}`;
    time = $(el).find('span[title]').attr('title');
    const timestamp = moment.utc(time, 'MM-DD-YYYY hh:mm A').unix();
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
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
          },
        },
      });
    }
  });
  return threads;
}

async function postHandler(page: Page): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const entryElements = $('div.post').get();
  const pageElements = $('tbody');
  let time: string;
  let timestamp: number;
  const title = $(pageElements).find('span[class="thread-info__name rounded"]').text().trim();
  entryElements.forEach((el: any) => {
    const articlefulltext = $(el)
      .find('div[class="post_body scaleimages"]')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    time = $(el).find('span[class="post_date"] span').attr('title');
    if (time) {
      timestamp = moment.utc(time, 'MM-DD-YYYY hh:mm A').unix();
    } else {
      time = $(el).find('div[class="post_head"]>span').text().trim();
      timestamp = moment.utc(time, 'MM-DD-YYYY hh:mm A').unix();
    }
    const text = `${articlefulltext} - ${title}`;
    const postUrl = $(el).find('div.float_right strong a').attr('href');
    posts.push(
      new Post(
        text,
        {
          current_url: `${source.url}${postUrl}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
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
