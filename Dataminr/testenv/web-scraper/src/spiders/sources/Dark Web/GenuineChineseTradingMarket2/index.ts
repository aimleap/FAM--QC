import moment from 'moment';
import _ from 'lodash';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'Genuine Chinese Trading Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://oniov7hgxjiwxl7zzpphriyletrdszj26hhtkiqh5rirttfycilu74id.onion',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = $(el).find('a').attr('href');
    items.push({
      title,
      link,
      parserName: 'thread',
      delay: _.random(15, 30) * 1000,
      timestamp: moment().unix(),
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3 a').text().trim();
    const link = $(el).find('h3 a').attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      delay: _.random(15, 30) * 1000,
      timestamp,
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const storename = $(elements).find('div[class="element-title shop-title"] h1').text().trim();
  const seller = $(elements).find('h4[class="author-name"] a').text().trim();
  const storedescription = $(elements).find('div[class="shop-content"]').contents().text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const productname = $(elements).find('h3[class="item-name"] a').text().trim();
  const price = $(elements).find('div[class="item-price left"] span[class="woocommerce-Price-amount amount"]').text().trim();
  const productdescription = $(elements).find('div[class="author-name"]').contents().text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${storename}\n${productname}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: storename,
          storename,
          seller,
          storedescription,
          productname,
          price,
          productdescription,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['ul[class="sub-menu"] li'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="shop-preview"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="site-wrap"]'],
      handler: postHandler,
    },
  ],
  1440,
);
