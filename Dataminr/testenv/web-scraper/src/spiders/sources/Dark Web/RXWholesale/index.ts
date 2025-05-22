import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'RX Wholesale',
  type: SourceTypeEnum.FORUM,
  url: 'http://rxwsalet5kapmpvemyipydmlpgzrd2k7i7isuxvjrlezcyvgkeuhqqyd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const encounteredTitles = new Set();
  elements.forEach((el) => {
    const title = $(el).find('span[class="product-title"]').text().trim();
    if (!encounteredTitles.has(title)) {
      encounteredTitles.add(title);
      let price = $(el).find('ins span[class="woocommerce-Price-amount amount"]').text().trim();
      if (price === '') {
        price = $(el).find('span[class="woocommerce-Price-amount amount"]').text().trim();
      }
      const articlefulltext = `${title}\n${price}`;
      const timestamp = moment().unix();
      posts.push(new Post(
        `${articlefulltext}`,
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
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ));
    }
  });

  return posts;
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
