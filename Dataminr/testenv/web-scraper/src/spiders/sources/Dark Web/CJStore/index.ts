import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'CJ Store',
  type: SourceTypeEnum.FORUM,
  url: 'http://kjsba5xg6vb7gvtzu7eecpwvsggem6qbvmw3h5enj3b4viqvksvktuyd.onion/shop/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a:first-child').attr('href');
    const title = $(el).find('a:first-child h2').text().trim();
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
  forumPaths: String[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements)
    .find('h1[class="product_title entry-title"]')
    .text()
    .trim();
  const price = $(elements)
    .find('p[class="price"] span')
    .contents()
    .text()
    .trim();
  const category = $(elements).find('span[class="posted_in"] a').text().trim();
  const description = $(elements)
    .find('div[class="woocommerce-product-details__short-description"]')
    .text()
    .trim()
    .replace(/[\r\t\n\s]+/g, ' ');
  const articlefulltext = $(elements)
    .find('div[id="tab-description"]')
    .contents()
    .text()
    .trim()
    .replace(/[\r\t\n\s]+/g, ' ');
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${articlefulltext}\n${title}`,
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
          ProductName: title,
          price,
          category,
          description,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['ul[class="products columns-4"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="woocommerce"]'],
      handler: postHandler,
    },
  ],
  1440,
);
