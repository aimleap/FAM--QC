import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Diagon Alley Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://diagon3a7nqnjv2nmsml62sfcb3h3awovfr7q7ihewedp5l3rwr6ruyd.onion/?product_cat=&post_type=product&s=',
};

async function paginationHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const pages = $(elements).find('a[class="page-numbers"]').text().trim();
  for (let i = 1; i <= Number(pages); i++) {
    const link = `http://diagon3a7nqnjv2nmsml62sfcb3h3awovfr7q7ihewedp5l3rwr6ruyd.onion/?product_cat&post_type=product&s&paged=${i}`;
    const title = '';
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  }
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((ele) => {
    const link = $(ele).find('a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]').attr('href');
    const title = $(ele).find('h2').text().trim();
    const price = $(ele).find('span[class="price"]').text().trim();
    const timestamp = moment().unix();
    posts.push(new Post(
      `${title}\n${price}`,
      {
        current_url: link,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          price,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'pagination',
      selector: ['*'],
      handler: paginationHandler,
    },
    {
      name: 'post',
      selector: ['ul[class="products columns-4"] li'],
      handler: postHandler,
    },
  ],
  1440,
);
