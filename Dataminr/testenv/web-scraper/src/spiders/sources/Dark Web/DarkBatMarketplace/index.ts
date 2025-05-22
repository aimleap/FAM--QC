import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: 'DarkBat Marketplace',
  type: SourceTypeEnum.FORUM,
  url: 'http://422ekdpplueem67fhz6liwko6fskspankd3wthpw5qvzmqtxjtxqqpad.onion/',
  requestOption: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a>div[title]').attr('title').trim();
    const link = `http://422ekdpplueem67fhz6liwko6fskspankd3wthpw5qvzmqtxjtxqqpad.onion/${$(el).find('a:nth-child(2)').attr('href')}`;
    const articlefulltext = $(el).find('div[class="description"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const price = $(el).find('div[class="price"]').text().trim();
    const text = `${title}\n${articlefulltext}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        text,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            articlefulltext,
            price,
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
      selector: ['div[class="item"]'],
      handler: postHandler,
    },
  ],
  1440,
);
