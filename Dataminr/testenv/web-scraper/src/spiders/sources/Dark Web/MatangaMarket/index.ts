import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Matanga Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://matangamycyrdgunlbk6rdrayckeko5ng3ah7rodonerb7eqcvfoxaid.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const seller = $(el).find('span[class="banner_title"]').contents().text()
      .trim();
    const product = $(el).find('div[class="banner_content_name"]').contents().text()
      .trim();
    const quantity = $(el).find('ul[class="description"] li:nth-child(1)').contents().text()
      .split(':')[1].trim();
    const weight = $(el).find('ul[class="description"] li:nth-child(3)').contents().text()
      .split(':')[1].trim();
    const price1 = $(el).find('div[class="price1"]').contents().text()
      .trim();
    const price2 = $(el).find('div[class="price2"]').contents().text()
      .trim();
    const price = `${price1} ${price2}`;
    const link = `http://matangamycyrdgunlbk6rdrayckeko5ng3ah7rodonerb7eqcvfoxaid.onion/${$(el).find('span[class="banner_title"] a:nth-child(2)').attr('href')}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${seller}\n${product}`,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: seller,
            seller,
            product,
            quantity,
            weight,
            price,
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
      name: 'post',
      selector: ['div[class="banner_wrapper"]'],
      handler: postHandler,
    },
  ],
  1440,
);
