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
  description: 'MarketPlace',
  isCloudFlare: false,
  name: 'BestDarkNet Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'https://bestdarknet.com/shop/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find('div[class="nv-card-content-wrapper"] a h2')
      .text()
      .trim();
    const link = $(el)
      .find('div[class="nv-card-content-wrapper"] a')
      .attr('href');
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
  let quantity = $(elements)
    .find(
      'div[class="woocommerce-product-details__short-description"] p:nth-of-type(2)',
    )
    .text()
    .trim();
  const title = $(elements).find('h1').text().trim();
  let price = $(elements).find('ins').text().trim();
  let item = $(elements)
    .find('div[class="woocommerce-product-details__short-description"] h2')
    .text()
    .trim();
  if (item === '') {
    item = title;
    quantity = $(elements)
      .find(
        'div[class="woocommerce-product-details__short-description"] p:nth-of-type(1)',
      )
      .text()
      .trim();
    price = $(elements).find('p[class="price"]').text().trim();
  }
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${item};\n${quantity};\n${price}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          title,
          item,
          quantity,
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
      name: 'thread',
      selector: ['ul[class="products columns-3"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="summary entry-summary"]'],
      handler: postHandler,
    },
  ],
  1440,
);
