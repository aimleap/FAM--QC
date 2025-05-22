import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Black Apple',
  type: SourceTypeEnum.FORUM,
  url: 'http://ossdenqc3rvy7i7ovcqyrc7pzvfkl2445fau6ney4rwt4lq6nqiujvyd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="wc-block-grid__product-title"]').text().trim();
    const price = $(el).find('div[class="wc-block-grid__product-price price"]').text().trim();
    const articlefulltext = `${title}\n${price}`;
    const timestamp = moment().unix();
    items.push(
      new Post(
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
      selector: ['li[class="wc-block-grid__product"]'],
      handler: postHandler,
    },
  ],
  1440,
);
