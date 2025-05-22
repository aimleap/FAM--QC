import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Clear Cash Seller',
  type: SourceTypeEnum.FORUM,
  url: 'http://cash26mgrqwoabxe3cr2ctmqg2kiqcp4inxq2kpgyl7klndfewe5mvqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: String[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements)
    .find('div[class="card  product-card"]')
    .get()
    .slice(3);
  entrySelector.forEach((el) => {
    const title = $(el).find('h4').text().trim();
    const articlefulltext = $(el)
      .find('div[class="card-block single-about-text"] p:first-of-type')
      .contents()
      .text()
      .trim();
    const quantity = $(el)
      .find('div[class="card-block single-about-text"] p:nth-of-type(2) b')
      .contents()
      .text()
      .trim();
    const balance = $(el)
      .find('div[class="card-block single-about-text"] p:nth-of-type(3) b')
      .contents()
      .text()
      .trim();
    const price = $(el)
      .find('div[class="card-block single-about-text"] button span')
      .text()
      .trim();
    const timestamp = moment().unix();
    posts.push(
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
            quantity,
            balance,
            price,
            articlefulltext,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
