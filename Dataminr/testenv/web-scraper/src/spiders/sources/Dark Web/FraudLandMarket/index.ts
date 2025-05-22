import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { getResponse } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'FraudLand Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://fraudlgedkoes7ffishrtex5eocobqtjrvuq2u3ckx54xlhfktwawvid.onion/',
  entryUrl:
    'index.php?rest_route=/wc/store/products&orderby=date&order=desc&catalog_visibility=catalog&per_page=50&page=1&_locale=user',
};

async function postHandler(): Promise<Post[]> {
  const posts: Post[] = [];
  const requestUrl = `${source.url}${source.entryUrl}`;
  const response = await getResponse(
    {
      url: requestUrl,
      method: 'GET',
    },
    source.isCloudFlare,
    source.name,
  );
  if (response.statusCode !== 200) return [];

  const jsondata = JSON.parse(response.body);
  jsondata.forEach((item: any) => {
    const url = item.permalink;
    const title = item.name;
    const articletext = typeof item.description === 'string'
      ? item.description.replace(/<.*?>/g, '')
      : item.description;
    const price = item.prices.sale_price;
    const timestamp = moment().unix();
    const text = `${title}\n${price}`;
    posts.push(
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
            entity: title,
            title,
            articletext,
            price,
            url,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  }, []);
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
