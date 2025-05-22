import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'SilverLine Shop',
  type: SourceTypeEnum.FORUM,
  url: 'http://hztsln4fi3udznlinmxnbwdey6lbehn4sinqa6ltbu4crxgqnlzdqoid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('a[class*="woocommerce-LoopProduct-link"]').attr('href');
    if (link1) {
      const title = $(el).find('h2[class="woocommerce-loop-product__title"]').text().trim();
      const link = $(el).find('a[class*="woocommerce-LoopProduct-link"]').attr('href');
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        timestamp,
        parserName: 'post',
      });
    }
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
  elements.forEach((el) => {
    const title = $(el).find('h1[class="product_title entry-title"]').text().trim();
    const longdescription = $(el).find('div[id="tab-description"]').contents().text()
      .replace('Description', '')
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const shortdescription1 = $(el).find('div[class="woocommerce-product-details__short-description"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const shortdescription2 = $(el).find('div[id="tab-additional_information"]').contents().text()
      .replace('Additional information', '')
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const articlefulltext = `${longdescription}\n${shortdescription1}\n${shortdescription2}`;
    const price = $(el).find('p[class="price"]').text().trim();
    const sku = $(el).find('span[class="sku_wrapper"] span[class="sku"]').text().replace('SKU:', '')
      .trim();
    const category = $(el).find('span[class="posted_in"]').text().replace('Category:', '')
      .replace('Categories:', '')
      .trim();
    const tag = $(el).find('span[class="tagged_as"]').text().replace('Tags:', '')
      .replace('Tag:', '')
      .trim();
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
            price,
            articlefulltext,
            sku,
            category,
            tag,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [

    {
      name: 'thread',
      selector: ['div[class="woocommerce"] li[class*="product type-product post"]'],
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
