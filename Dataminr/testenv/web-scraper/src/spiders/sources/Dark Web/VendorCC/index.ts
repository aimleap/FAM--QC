import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'VendorCC',
  type: SourceTypeEnum.FORUM,
  url: 'http://4m2pasvwx5jux7heojpzrq6mlrzug5m7u23cs5hf4bswtgapwkdpcayd.onion/',

};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const entrySelector = $(elements).find('tbody tr').get();
  entrySelector.forEach((el) => {
    const ccid = $(el).find('td:nth-child(1)').text().trim();
    const type = $(el).find('td:nth-child(2)').text().trim();
    const country = $(el).find('td:nth-child(3)').text().trim();
    const price = $(el).find('td:nth-child(7)').text().trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${type}\n${ccid}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            type,
            ccid,
            price,
            country,
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
