import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Fish & Pal 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://56dlutemceny6ncaxolpn6lety2cqfz5fd64nx4ohevj4a7ricixwzad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('li a').get().slice(1, 5);
  entrySelector.forEach((el) => {
    const link = `http://56dlutemceny6ncaxolpn6lety2cqfz5fd64nx4ohevj4a7ricixwzad.onion/${$(el).attr('href')}`;
    const title = $(el).text().trim();
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const selector = 'ul[class="pricingTable-firstTable"]';
  const firstSelector = $(elements).find(selector);
  if (firstSelector.length > 0) {
    const entrySelector = firstSelector.find('li[class="pricingTable-firstTable_table"]').get();
    entrySelector.forEach((el) => {
      const title = $(el).find('h1').text().trim();
      const price = $(el).find('p[class="pricingTable-firstTable_table__pricing"]').text().replace('each', '')
        .trim();
      const articlefulltext = $(el).find('ul[class="pricingTable-firstTable_table__options"]').text().replace(/\s+/g, ' ')
        .trim();
      const timestamp = moment().unix();
      items.push(
        new Post(
          `${title}\n${price}`,
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
  } else {
    const entrySelector2 = $(elements).find('tbody:last tr').get().slice(1);
    entrySelector2.forEach((el) => {
      const ourprice1 = $(el).find('td:nth-of-type(6)').text().trim();
      if (ourprice1) {
        const internaluid = $(el).find('td:nth-of-type(1)').text().trim();
        const balance = $(el).find('td:nth-of-type(2)').text().trim();
        const accounttype = $(el).find('td:nth-of-type(3)').text().trim();
        const card = $(el).find('td:nth-of-type(4)').text().trim();
        const country = $(el).find('td:nth-of-type(5)').text().trim();
        const ourprice = $(el).find('td:nth-of-type(6)').text().trim();
        const articlefulltext = `${internaluid}\n${balance}\n${accounttype}\n${card}\n${country}\n${ourprice}`;
        const timestamp = moment().unix();
        items.push(
          new Post(
            articlefulltext,
            {
              current_url: url,
            },
            timestamp,
            [],
            [],
            new Map(
              Object.entries({
                entity: internaluid,
                internaluid,
                balance,
                accounttype,
                card,
                country,
                price: ourprice,
                articlefulltext,
                ingestpurpose: 'darkweb',
                parser_type: PARSER_TYPE.AIMLEAP_PARSER,
              }),
            ),
          ),
        );
      }
    });
  }
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="menu"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
