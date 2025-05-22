import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: 'Anonymous Marketplace 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://sr4rya7za4kvocstuc7s2ed3f6tlsqbx4o5afdtqyjl4b3uzb5o23xad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a[class*="woocommerce-LoopProduct-link "]').attr('href');
    const title = $(el).find('a[class*="woocommerce-LoopProduct-link "] h2').text().trim();
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
  const title = $(elements).find('div[class="summary entry-summary"] h1[class*="product_title"]').text().trim();
  const articlefulltext = $(elements).find('div[id="tab-description"] p').text().trim();
  const Price = $(elements).find('p[class="price"] ins').text().trim();
  const SKU = $(elements).find('span[class="sku"]').text().trim();
  const Category = $(elements).find('span[class="posted_in"] a').text().trim();
  const Tags = $(elements).find('span[class="tagged_as"] a').text().trim();
  const Reviews = $(elements).find('a[href="#reviews"] span').text().trim();
  const timestamp = moment().unix();
  const text = `${articlefulltext}\n${title}`;
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
          articlefulltext,
          Price,
          SKU,
          Reviews,
          Category,
          Tags,
          CompanyName: title,
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
