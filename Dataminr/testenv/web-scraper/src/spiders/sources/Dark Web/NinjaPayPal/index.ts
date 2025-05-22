import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Ninja PayPal',
  type: SourceTypeEnum.FORUM,
  url: 'http://zutl3lcn3exp7bcxp6l2lkbstxg5yumu7uwmauk5dxem4mq6edqjkzyd.onion/',
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
    const title = $(el).find('td:nth-of-type(1)').text().trim();
    const type = $(el).find('td:nth-of-type(2)').text().trim();
    const balance = $(el).find('td:nth-of-type(3)').text().trim();
    const rate = $(el).find('td:nth-of-type(4)').text().trim();
    const price = $(el).find('td:nth-of-type(5)').text().trim();
    const articlefulltext = `${title}\n${type}\n${balance}\n${rate}\n${price}`;
    const timestamp = moment().unix();
    if (
      rate !== ''
      && !rate.includes('Sold Out')
      && !rate.includes('Removed')
    ) {
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
              type,
              balance,
              rate,
              price,
              articlefulltext,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['table tr'],
      handler: postHandler,
    },
  ],
  1440,
);
