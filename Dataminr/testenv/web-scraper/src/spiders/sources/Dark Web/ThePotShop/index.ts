import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'The Pot Shop',
  type: SourceTypeEnum.FORUM,
  url: 'http://potshopk4eov76aciyranqyq2r3mszuvfisvneytodfxo56ubha7doqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="wc-block-grid__product-title"]').text().trim();
    const link = $(el).find('a[class="wc-block-grid__product-link"]').attr('href');
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
    const timestamp = moment().unix();
    const category = $(el).find('span[class="posted_in"] a').contents().text()
      .trim(); // .replace('Category:','')
    let price = $(el).find('div[class="summary entry-summary"] ins span[class="woocommerce-Price-amount amount"]').text().trim();
    if (!price) {
      price = $(el).find('div[class="summary entry-summary"] span[class="woocommerce-Price-amount amount"]').text().trim();
    }
    const shortdescription = $(el).find('div[class="woocommerce-product-details__short-description"]').contents().text()
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
    const longdescription = $(el).find('div[id="tab-description"]').contents().text()
      .replace('Description', '')
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
    const articletext = `${shortdescription}\n${longdescription}`;
    const sku = $(el).find('span[class="sku"]').text().trim();

    items.push(
      new Post(
        `${articletext}\n${title}`,
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
            articlefulltext: articletext,
            category,
            sku,
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
      selector: ['li[class="wc-block-grid__product"]'],
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
