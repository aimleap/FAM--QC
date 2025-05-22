import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Joy Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://joymt62k3bthft55bauf3evjrrlrcluiyo2fmyt4mmzuqp4emeh4vvqd.onion/shop/',
};
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('a[class="name woocommerce-loop-product__title nasa-show-one-line"]').attr('href');
    if (link1) {
      const title = $(el).find('a[class="name woocommerce-loop-product__title nasa-show-one-line"]').text().trim();
      const link = $(el).find('a[class="name woocommerce-loop-product__title nasa-show-one-line"]').attr('href');
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
    const articlefulltext = $(el).find('div[class="woocommerce-product-details__short-description"]').contents().text()
      .replace('Description', '')
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    let price = $(el).find('p[class="price nasa-single-product-price"] ins span[class="woocommerce-Price-amount amount"]').text().trim();
    if (price === '') {
      price = $(el).find('div[class="row focus-info"] p[class="price nasa-single-product-price"] span[class="woocommerce-Price-amount amount"]').text().trim();
    }
    const soldby = $(el).find('div[class="row focus-info"] span[class="nasa-dokan-sold_by_in_loop"] a').text().trim();
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
            soldby,
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
      selector: ['li[class="product-warp-item"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="row focus-info"]'],
      handler: postHandler,
    },
  ],
  1440,
);
