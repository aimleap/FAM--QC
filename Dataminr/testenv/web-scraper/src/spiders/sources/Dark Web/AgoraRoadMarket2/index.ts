import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Marketplace',
  isCloudFlare: false,
  name: 'Agora Road Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://agoraqxaz3pyvxsedpamwk4pg4y7ime52gmno6azba7im5i7e2bqxaad.onion/',
};
async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="store-data"] a').text().trim();
    const link = $(el).find('div[class="store-data"] a').attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
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
    const title = $(el).find('h2').text().trim();
    const link = $(el).attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
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
  const title = $(elements).find('h1').text().trim();
  const articlefulltext = $(elements)
    .find('div[class="woocommerce-product-details__short-description"] p')
    .contents()
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const price = $(elements).find('p[class="price"]').text().trim();
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${title}`,
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
          price,
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
      selector: [
        'div[id="dokan-seller-listing-wrap"] div[class="store-wrapper"]',
      ],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="products columns-4"] a[class*="LoopProduct-link"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
