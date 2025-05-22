import moment from 'moment';
import cheerio from 'cheerio';
import { Page } from 'puppeteer';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: 'ASAP Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://4rumaps2oow3na5nhpdnc6pifflu5xtoifkala7t6si4al2eli4lj3qd.onion/',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[id="portal_threads"]');
}

async function parsePage(page: Page): Promise<CheerioSelector | null> {
  const content = await page.content();
  return cheerio.load(content);
}

async function postHandler(page: Page): Promise<Post[]> {
  const posts: Post[] = [];
  await navigateToPage(page);
  const $ = await parsePage(page);
  if ($ === null) return [];
  const entrySelector = $('div[id="portal_threads"]').get();
  entrySelector.forEach((el) => {
    const $el = $(el);
    const title = $el.find('h2').text().trim();
    const articletext = $el.find('p[class="portal-message"]').text().trim();
    const username = $el.find('a[href*="profile"]').text().trim();
    let time1 = $(el)
      .find('td[class="trow1 scaleimages no_bottom_border"]')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .split(', ')[1];
    if (time1.includes('Yesterday')) {
      time1 = $el.find('span').attr('title');
    }
    const time2 = $(el)
      .find('td[class="trow1 scaleimages no_bottom_border"]')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .split(', ')[2]
      .split(' ')
      .slice(1, 3);
    const time = `${time1} ${time2[0]} ${time2[1]}`;
    const timestamp = moment.utc(time, 'MM-DD-YYYY hh:mm A').unix();
    posts.push(
      new Post(
        `${title}: ${articletext}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            entity: title,
            username,
            articlefulltext: articletext,
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
      name: 'post',
      // @ts-ignore
      parser: postHandler,
    },
  ],
  1440,
);
