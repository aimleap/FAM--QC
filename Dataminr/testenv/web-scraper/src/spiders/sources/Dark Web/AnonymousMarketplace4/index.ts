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
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Anonymous Marketplace 4',
  type: SourceTypeEnum.FORUM,
  url: 'http://anonymsfs4u4odhzn6qx66bhzmfx43rgcgpooqduhfqq62zr3qtynzid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="title"]').text().trim();
    const link = $(el).find('a[class="title"]').attr('href');
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
  const items: Post[] = [];
  const title = $(elements).find('h1[itemprop="name"]').text().trim();

  let price = $(elements)
    .find(
      'p[class="price"] ins span[class="woocommerce-Price-amount amount"] bdi',
    )
    .text()
    .trim();
  if (!price) {
    price = $(elements).find('p[class="price"]').text().trim();
  }
  const category = $(elements).find('span[class="posted_in"] a').text().trim();
  const tags = $(elements)
    .find('span[class="tagged_as"]')
    .contents()
    .text()
    .replace('Tags: ', '')
    .trim();
  const productdescription = $(elements)
    .find('div[id="tab-description"]')
    .contents()
    .text()
    .trim();
  const shortdescription = $(elements)
    .find('div[class="woocommerce-product-details__short-description"] p')
    .contents()
    .text()
    .trim();
  const additionalinformation = $(elements)
    .find('div[id="tab-additional_information"]')
    .contents()
    .text()
    .trim();
  const articlefulltext = `${shortdescription
  } ${
    productdescription
  } ${
    additionalinformation}`;
  const reviewscount = $(elements)
    .find('span[class="rating-text"]')
    .text()
    .trim();
  const timestamp = moment().unix();
  items.push(
    new Post(
      `${articlefulltext}\n${title}\n${tags}`,
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
          tags,
          category,
          reviewscount,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );

  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="the-post group"]'],
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
