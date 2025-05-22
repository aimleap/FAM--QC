import moment from 'moment';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'Global Dreams',
  type: SourceTypeEnum.FORUM,
  url: 'http://global44mwk3vmxhntnyxhst622rrsftc4ao7rwxfz3c7e3jxbtumyqd.onion/',
};
async function paginationHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).attr('href');
    const title = $(el).text().trim();
    items.push({
      title,
      link,
      parserName: 'thread',
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
  const title = $(elements)
    .find('nav[class="woocommerce-breadcrumb"] ')
    .text()
    .trim()
    .split('/')[-1];
  const category = $(elements).find('span[class="posted_in"] a').text().trim();
  const price = $(elements).find('p[class="price"] bdi').text().trim();
  const description = $(elements).find('div[id="tab-description"] p').text();
  const text = `${price}\n${description}`;
  const timestamp = moment().unix();
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
          entity: title,
          title,
          description,
          price,
          category,
          ingestpurpose: 'darkweb',
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
      name: 'pagination',
      selector: ['ul[class="product-categories"] li a '],
      handler: paginationHandler,
    },
    {
      name: 'thread',
      selector: [
        'ul[class="products columns-6"] li a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]',
      ],
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
