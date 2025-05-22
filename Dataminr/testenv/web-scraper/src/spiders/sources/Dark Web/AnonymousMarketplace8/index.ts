import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Anonymous Marketplace 8',
  type: SourceTypeEnum.FORUM,
  url: 'http://2ppas4x76fgyjzmtmo6yh47c4nwg4f6fbyu6yild3dq5dz3yow6dsnid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]').attr('href');
    if (link1) {
      const title = $(el).find('h2[class="woocommerce-loop-product__title"]').text().trim();
      const link = $(el).find('a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]').attr('href');
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
    const longdescription = $(el).find('div[id="tab-description"]:first').contents().text()
      .replace('Description', '')
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const shortdescription = $(el).find('div[class="woocommerce-product-details__short-description"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    let price = $(el).find('p[class="price"] ins span[class="woocommerce-Price-amount amount"]').text().trim();
    if (price === '') {
      price = $(el).find('p[class="price"]').text().trim();
    }
    const sku = $(el).find('span[class="sku_wrapper"] span[class="sku"]').text().trim();
    const categories = $(el).find('span[class="posted_in"]').text().replace('Categories:', '')
      .replace('Category:', '')
      .trim();
    const tags = $(el).find('span[class="tagged_as"]').text().replace('Tags:', '')
      .replace('Tag:', '')
      .trim();
    const articlefulltext = `${longdescription} ${shortdescription}`;
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
            categories,
            tags,
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
      selector: ['ul[class*="products columns"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="row rsrc-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
