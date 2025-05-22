import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'PayPal and Credit Cards',
  type: SourceTypeEnum.FORUM,
  url: 'http://tqapoj3kjizhcymmhdsjtkuof7auxtpmcxlef7txrlgbw2twy4moxjid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((ele) => {
    const entrySelector = $(ele).find('tbody tr').get().slice(2);
    entrySelector.forEach((el) => {
      const title = $(el).find('td:nth-child(1)').text().trim();
      const balance = $(el).find('td:nth-child(2)').text().trim();
      const acountType = $(el).find('td:nth-child(3)').text().trim();
      const card = $(el).find('td:nth-child(4)').text().trim();
      const country = $(el).find('td:nth-child(5)').text().trim();
      const price = $(el).find('td:nth-child(6)').text().trim();
      const articlefulltext = $(el).find('header p').text().trim();
      const timestamp = moment().unix();
      const text = `${title}\n${balance}\n${acountType}\n${card}\n${country}\n${price}`;
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
              acountType,
              country,
              card,
              price,
              articlefulltext,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    });
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
