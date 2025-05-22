import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'GiftTo Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://giftto33ep564ztvpc6652xt4vkupphghcvtxqwpxi6gq5k2fmjd4zid.onion/',

};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const articletext = $(elements).find('div.row:nth-child(2) > div:nth-child(1)').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('div[class="col-md-3"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('p:nth-child(1)').text().replace('Add To Cart', '')
      .trim();
    const price = $(el).find('p[style*="color:#04B745;"] b').text().trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        title,
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
            articletext,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
