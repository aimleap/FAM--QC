import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Hidden PayPal',
  type: SourceTypeEnum.FORUM,
  url: 'http://g72u5pyixdbsdnerpjzrlbp37wzxengftwcdynmxkje3dngbgu3gchqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const articletext = $(elements).find('div.content:nth-child(3) div:nth-child(2) p').contents().text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('div[class="content products"]:nth-child(4) div:nth-child(2) main:nth-child(1) table:nth-child(1) tbody:nth-child(2) tr').get();
  entrySelector.forEach((el) => {
    const id = $(el).find('td:nth-child(1)').text().trim();
    const balance = $(el).find('td:nth-child(2)').text().trim();
    const price = $(el).find('td:nth-child(3)').text().trim();
    const status = $(el).find('td:nth-child(4)').text().trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${id}\n${price}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: id,
            id,
            balance,
            price,
            status,
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
