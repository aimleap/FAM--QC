import cheerio from 'cheerio';
import moment from 'moment';
import { Page } from 'puppeteer';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';
import { delay } from '../../../../lib/crawler';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: true,
  name: 'Hydra Forums',
  type: SourceTypeEnum.FORUM,
  url: 'https://hydraforums.io/',
  requestOption: {
    strictSSL: false,
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9,id;q=0.8,ru;q=0.7',
      'cache-control': 'max-age=0',
      priority: 'u=0, i',
      referer: 'https://hydraforums.io/Forums-web-hacking-and-security',
      'sec-ch-ua': '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-arch': '"x86"',
      'sec-ch-ua-bitness': '"64"',
      'sec-ch-ua-full-version': '"136.0.3240.64"',
      'sec-ch-ua-full-version-list': '"Chromium";v="136.0.7103.93", "Microsoft Edge";v="136.0.3240.64", "Not.A/Brand";v="99.0.0.0"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-model': '""',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-platform-version': '"19.0.0"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0',
      cookie: '_ga=GA1.1.854355957.1747373207; cf_clearance=PNKTlomIVkbTKw5ppWiZJ9HVknyWtNbfYPCZXolD.I0-1747380456-1.2.1.1-Wy9VzAF_gZq83GrD2Bbqemolef3h_Eej5jJAtjy6V.cH13erBiOCdf8VRnUR9T8.reGIMc4p9jCiqSbBHYC3qdiBDMQvgybcAt8_69TRCR4axPz1X472jSYIikUkAFU5bhfqeTEzq8vPhZZ53bLdWKaeowlYLALrqRx9trlmtFZ10pTd3gR3LRHf2_Rz05T.tYr.NvheZB7o2loSwRHCFXFgKQnrTcHVvkROOvrgFy4BxULk9b3o9RAD16izwbYKop2tVztGsz94cRU_Q2U9o55Md3fwx84BFF07rPwjKoMHLVpZnv43.S9Ie.QSUGtc0_q0rhqS1ehOl7e2g7Dhwb1YAj5D6I03_LTGDy6.d_tUl4P_23pTR5gobY24b1Yf; mybb[threadread]=a%3A2%3A%7Bi%3A35140%3Bi%3A1747378694%3Bi%3A4284%3Bi%3A1747380457%3B%7D; mybb[forumread]=a%3A2%3A%7Bi%3A94%3Bi%3A1747379202%3Bi%3A14%3Bi%3A1747380457%3B%7D; _ga_3MKHNQ55XD=GS2.1.s1747378387$o2$g1$t1747380616$j0$l0$h0',
    },
  },
  randomDelay: [10, 20],
};

async function navigateToMainPage(page: Page) {
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

async function categoryHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const excludeSections = ['Porn Leaks', 'Nude Celebs', 'Video/Song'];
  const forumBlocks = $('div[class="d-flex forum-body"]').get();
  forumBlocks.forEach((block) => {
    const sectionAnchor = $(block).find('h3 a').first();
    const sectionTitle = sectionAnchor.text().trim();
    if (!excludeSections.includes(sectionTitle)) {
      const link = sectionAnchor.attr('href');
      const timestamp = moment().unix();
      threads.push({
        title: sectionTitle,
        link,
        timestamp,
        parserName: 'thread',
      });
    }
  });
  return threads;
}

async function threadHandler(page: Page): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  await navigateToMainPage(page);
  const $ = await parsePage(page);
  const Elements = $('div[class="threadlist"]').get();
  Elements.forEach((el) => {
    const link = $(el).find('div[class="golastpost"] a').attr('href');
    const title = $(el).find('div[class="name"] span a').text().trim();
    const times = $(el).find('div[class="small"]').text().split('•')[1].trim();
    const timestamp = moment.utc(times, 'MM-DD-YYYY, hh:mm A').unix();
    if (timestamp) {
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

async function postHandler(page: Page): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPostPage(page);
  const $ = await parsePage(page);
  const url = page.url();
  $('div[class="quote"], div[id="breadcrumb_multipage_popup"]').remove();
  const forumSection = $('div[class="navigation"] a').last().text().trim();
  const title = $('div[class="st-title"]').first().text().trim();
  const entrySelector = $('div[id="posts"] article').last().get();
  entrySelector.forEach((el: any) => {
    const isFirstPost = $(el)
      .find(
        'div[class="right postbit-number"] a',
      )
      .text()
      .trim() === '#1';
    const articlefulltext = $(el).find('div[class="post_body scaleimages"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const username = $(el).find('div[class="post-h-username"] a').text().trim();
    const times = $(el).find('span[class="post_date"]').text().trim();
    const timestamp = moment.utc(times, 'MM-DD-YYYY, hh:mm A').unix();
    const text = formatText(isFirstPost, title, articlefulltext, username);
    const threadId = generateThreadId(title);
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
            username,
            title,
            forumSection,
            parent_uuid: threadId,
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
      name: 'category',
      parser: categoryHandler,
    },
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu'],
    ignoreHTTPSErrors: true,
  },
);
