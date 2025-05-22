/* eslint-disable no-undef */
import { Page } from 'puppeteer';
import moment from 'moment';
import cheerio from 'cheerio';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import PuppeteerParserStealth from '../../../parsers/PuppeteerParserStealth';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'Br0k3r',
  type: SourceTypeEnum.FORUM,
  url: 'http://brok3r7bhcblynwpoymgarr6zwcy4ttfbhkhcmotz4lw2gcsuojgaeqd.onion/#networks',
};

async function navigateToPage(page: Page) {
  await page.waitForSelector('div[class="timeline-panel"]');
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
  const entrySelector = $('div[class="timeline-panel"]').get();
  entrySelector.forEach((el) => {
    const Identifier = $(el).find('div[class="timeline-heading"] h4 a').text().trim();
    const Industry = $(el).find('tr td:nth-child(1)').text().trim();
    const revenue = $(el).find('tr td:nth-child(2)').text().trim();
    const about = $(el).find('tr td:nth-child(3)').text().trim();
    const timestamp = moment().unix();
    const text = `${Identifier}\n${revenue}\n${about}`;
    posts.push(
      new Post(
        text,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            Identifier,
            Industry,
            revenue,
            about,
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
