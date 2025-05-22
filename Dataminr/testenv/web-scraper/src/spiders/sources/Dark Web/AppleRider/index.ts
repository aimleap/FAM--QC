import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'AppleRider',
  type: SourceTypeEnum.FORUM,
  url: 'http://applmdkj5eycturjwytex42no5cef7k7ozrezaaumon7o2arwiwf4sqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="products-item-title"]').text().trim()
      .replace(/^\s+|\n+$/gm, ',');
    const tags = $(el).find('div[class="products-item-marker"]').text().trim()
      .replace(/^\s+|\n+$/gm, '')
      .replace('\n', ', ');
    const RegularPrice = $(el).find('span[class="products-item-price-old"]').text().trim();
    const discount = $(el).find('span[class="products-item-price-new"]').text().trim();
    const CurrentPrice = $(el).find('span[class="products-item-price-dollar"]').text().trim();
    const timestamp = moment().unix();
    const text = `${title}\n${CurrentPrice}\n${tags}`;
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
            tags,
            CurrentPrice,
            RegularPrice,
            discount,
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
      selector: ['article[class="products-item"]'],
      handler: postHandler,
    },
  ],
  1440,
);
