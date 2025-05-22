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
  description: 'General Market',
  isCloudFlare: false,
  name: 'The Card House',
  type: SourceTypeEnum.FORUM,
  url: 'http://cardh5ihxbnljbh6ipjt5v5crpqgvt7umtqbuphm7ezh2anikwby5yqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find('div[class="wc-block-grid__product-title"]')
      .text()
      .trim();
    const link = $(el)
      .find('a[class="wc-block-grid__product-link"]')
      .attr('href');
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
  let price = $(elements).find('p[class="price"] ins bdi').text().trim();
  if (price === '') {
    price = $(elements).find('p[class="price"]  bdi').text().trim();
  }
  const articlefulltext = $(elements)
    .find('div[class="woocommerce-product-details__short-description"]')
    .text()
    .trim();
  const text = `${title}\n${articlefulltext}`;
  const timestamp = moment().unix();
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
          price,
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
      selector: ['li[class="wc-block-grid__product"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="entry-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
