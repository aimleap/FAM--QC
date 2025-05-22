import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Alpha Vendor',
  type: SourceTypeEnum.FORUM,
  url: 'http://lxgbffibchcvrp7k633uwrjlrrbfnwkysnpw2xcf5vb32oyeczdmnvid.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('span[class="product-title"]').text().trim();
    const link = $(el).find('a').attr('href');
    const price = `$${
      $(el).find('span[class="woocommerce-Price-amount amount"]').text().trim()
        .split('$')[1]
    }`;
    const timestamp = moment().unix();
    items.push(
      new Post(
        title,
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
      name: 'post',
      selector: ['ul[class="product_list_widget"] li'],
      handler: postHandler,
    },
  ],
  1440,
);
