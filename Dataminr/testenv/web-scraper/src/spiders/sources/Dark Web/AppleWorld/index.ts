import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: 'Apple World',
  type: SourceTypeEnum.FORUM,
  url: 'http://geue766hxjl5lcwpksxywpxolidieauask4klnw5xxvwojiw6n7zkxqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="product-name"]').text().trim();
    const ProductMemory = $(el).find('div[class="product-memory"]').text().trim();
    const Price = $(el).find('div[class="product-price"]').text().trim();
    const timestamp = moment().unix();
    const text = `${title}\n${Price}`;
    items.push(
      new Post(
        text,
        {
          current_url: `${source.url}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            enity: title,
            title,
            ProductMemory,
            Price,

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
      selector: ['div[class="product"]'],
      handler: postHandler,
    },
  ],
  1440,
);
