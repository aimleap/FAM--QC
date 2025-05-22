import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Gifthub',
  type: SourceTypeEnum.FORUM,
  url: 'http://dmriwkt7jefo5sf7vvmvvndq2lqrfe7itmntxnwfwwkrm67n4o22llyd.onion/generate/',
  requestOption: {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('a[class="button"]').attr('href').split('/')[4];
  const articletext = $(elements).find('span[class="short-description"] p').text().trim();
  const price = $(elements).find('span[class="price"]').text().trim();
  const timestamp = moment().unix();
  posts.push(new Post(
    `${articletext}\n${title}`,
    {
      current_url: `${source.url}`,
    },
    timestamp,
    [],
    [],
    new Map(
      Object.entries({
        entity: title,
        title,
        price,
        articlefulltext: articletext,
        ingestpurpose: 'darkweb',
        parser_type: PARSER_TYPE.AIMLEAP_PARSER,
      }),
    ),
  ));
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
