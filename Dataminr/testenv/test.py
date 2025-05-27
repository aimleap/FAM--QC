import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: '21 Million Club Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://million5utxgrxru4rqmjwn7jji6bf44jkdqn3xyav6md5ebwy5l2ryd.onion/',
  entryUrl: 'buy.php',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const domain = $(el).find('td:nth-child(2)').text().trim();
    let Availability = $(el).find('td span').text().trim();
    if (Availability === '') {
      Availability = $(el).find('td a').text().trim();
    }
    const walletType = $(el).find('td:nth-child(3)').text().trim();
    const Balance = $(el).find('td:nth-child(4)').text().trim();
    const Price = $(el).find('td:nth-child(5)').text().trim();
    const timestamp = moment().unix();
    const text = `${walletType}\n${Price}\n${Availability}`;
    items.push(
      new Post(
        text,
        {
          current_url: `${source.url}${source.entryUrl}`
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            enity: walletType,
            title: walletType,
            Availability,
            domain,
            Price,
            Balance,
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
      selector: ['tr[class="product-row"]'],
      handler: postHandler,
    },
  ],
  1440,
);
