import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'Red Bull Marketplace',
  type: SourceTypeEnum.FORUM,
  url: 'http://777777ipar4tzwxylsznx6o7trdgo5dgirkjx3orufjjnenjbe5xheyd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a:nth-child(1) h2').text().trim();
    const link = $(el).find('a:nth-child(1)').attr('href');

    const timestamp = moment().unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const articlefulltext = $(elements)
    .find('div[class="woocommerce-product-details__short-description"] p')
    .text()
    .trim();
  const Store = $(elements)
    .find('li[class="store-name"] span[class="details"]')
    .text()
    .trim();
  const vendor = $(elements)
    .find('li[class="seller-name"] span[class="details"]')
    .text()
    .trim();
  const address = $(elements)
    .find('li[class="store-address"] span[class="details"]')
    .text()
    .trim();
  const reviews = $(elements)
    .find('li[class="clearfix"] span[class="text"]')
    .text()
    .trim();
  const timestamp = moment().unix();
  const text = `${title}\n${articlefulltext}`;

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
          articlefulltext,
          vendor,
          Store,
          address,
          reviews,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );

  return posts;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['li[class*="product"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="primary"]'],
      handler: postHandler,
    },
  ],
  1440,
);
