import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Marketplace',
  isCloudFlare: false,
  name: 'ThePaypalWorld ',
  type: SourceTypeEnum.FORUM,
  url: 'http://h56izbbvplxoedu7rnqyzgqkkxrriqhoq6kl4g3xx2mjwauxdpyuhlqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const articletext = $(el).find('td:nth-child(3)').text();
    const UID = $(el).find('td:nth-child(1)').text().trim();
    const balance = $(el).find('td:nth-child(2)').text().trim();
    const card = $(el).find('td:nth-child(4)').text().trim();
    const country = $(el).find('td:nth-child(5)').text().trim();
    const ourprice = $(el).find('td:nth-child(6)').text().trim();
    const timestamp = moment().unix();
    const text = `${articletext}\n${UID}`;
    posts.push(
      new Post(
        text,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: UID,
            title: UID,
            CompanyName: UID,
            articletext,
            card,
            balance,
            country,
            ourprice,
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
      selector: ['table[class="hovered"] tr:not(:first-child)'],
      handler: postHandler,
    },
  ],
  1440,
);
