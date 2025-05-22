import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'Clone CC Empire',
  type: SourceTypeEnum.FORUM,
  url: 'http://sii4n4uweupfrmdsbnasw2dru4ohkedrvj3n6j6pm4hmnbwe3coi3jid.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const entrySelector = $(elements)
    .find('div[class*="wp-block-column "] p strong')
    .get()
    .slice(2);
  entrySelector.forEach((el) => {
    const element = $(el).text().replace(/\s+/g, ' ').trim()
      .split(' ');
    const price = element[2];
    const quantity = element[0];
    const title = element.slice(3).join(' ');
    const timestamp = moment().unix();
    const text = `${title}\n${price}`;
    items.push(
      new Post(
        text,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            enity: title,
            title,
            quantity,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
