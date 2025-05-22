import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'Cardzilla',
  type: SourceTypeEnum.FORUM,
  url: 'http://cardzilevs4j4nj6uswfwf35oxnp64yrrtazjgap2w3vgoz2pwkp6sqd.onion/#products',
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
    const title = $(el).find('h4').text().trim();
    const articlefulltext = $(el).find('p').text().trim();
    const price = $(el).find('h1').text().trim();
    const balance = articlefulltext.split('$')[1];
    const timestamp = moment().unix();
    const text = `${title}\n${articlefulltext}`;
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
            articlefulltext,
            balance,
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
      selector: ['div[id*="List"] div[class="card  product-card"]'],
      handler: postHandler,
    },
  ],
  1440,
);
