import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'Alpha Royal Shop',
  type: SourceTypeEnum.FORUM,
  url: 'http://ejtgtrocvzxwtlp22sq4nlbv6pl2usoorsqf67oxi7urvlkh5f2y2ryd.onion/shop/',
};

async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3 a').text().trim();
    const link = $(el).find('h3 a').attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
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
  const posts: Post[] = [];
  const title = $(elements).find('div[class="summary entry-summary"] h1').text().trim();
  let price = $(elements).find('p[class="price"] ins span[class="woocommerce-Price-amount amount"]').text().trim();
  if (!price) {
    price = $(elements).find('p[class="price"] span[class="woocommerce-Price-amount amount"]').text().trim();
  }
  const category = $(elements).find('div[class="product_meta"] span[class="posted_in"] a').text().trim();
  const shortdescription = $(elements).find('div[class="woocommerce-product-details__short-description"]').text().replace(/[\t\n\s]+/g, ' ')
    .trim();
  const longdescription = $(elements).find('div[id="tab-description"]').text().replace(/[\t\n\s]+/g, ' ')
    .trim();
  const description = `${shortdescription} ${longdescription}`;
  const tag = $(elements).find('span[class="tagged_as"] a').text().trim();
  const timestamp = moment().unix();
  posts.push(new Post(
    `${title}; ${description}; ${category}`,
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
        category,
        description,
        tag,
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
      name: 'thread',
      selector: ['div[class="product_wrapper"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['main[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
