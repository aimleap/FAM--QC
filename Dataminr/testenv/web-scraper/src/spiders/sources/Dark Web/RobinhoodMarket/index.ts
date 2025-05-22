import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Robinhood Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://ilr3qzubfnx33vbhal7l5coo4ftqlkv2tboph4ujog5crz6m5ua2b2ad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a:first').attr('href');
    const title = $(el).find('h2[class="woocommerce-loop-product__title"]').text().trim();
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
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h1[class="product_title entry-title"]').text().trim();
    let price = $(el).find('p[class="price"] ins span[class="woocommerce-Price-amount amount"]').text().trim();
    if (price === '') {
      price = $(el).find('p[class="price"] span[class="woocommerce-Price-amount amount"]').text().trim();
    }
    const articlefulltext = $(el).find('div[id="tab-description"]').contents().text()
      .replace('Description', '')
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const vendor = $(el).find('div[class="wcfmmp_sold_by_store"] a').text().trim();
    const sku = $(el).find('span[class="sku"]').text().trim();
    const categories = $(el).find('span[class="posted_in"]').text().replace('Category:', '')
      .replace('Categories:', '')
      .trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${title}\n${price}`,
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
            vendor,
            sku,
            categories,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="woocommerce columns-4 "]:nth-of-type(2) li[class*="product type-product post"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="content-area"]'],
      handler: postHandler,
    },
  ],
  1440,
);
