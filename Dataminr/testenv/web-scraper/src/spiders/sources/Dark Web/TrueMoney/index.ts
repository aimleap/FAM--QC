import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'True Money',
  type: SourceTypeEnum.FORUM,
  url: 'http://r722lrlb2f4gat7djrogjttel4s6eumx7l4x6nd5xa7xlzjyazgjorid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="wpt_product_title_in_td"]').text().trim();
    const link = $(el).find('a').attr('href');
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
  elements.forEach((el) => {
    const title = $(el).find('h1[class="product_title entry-title"]').text().trim();
    const timestamp = moment().unix();
    const priceMethod1 = $(el).find('ins').text().trim();
    const priceMethod2 = $(el).find('p[class="price"]').text().trim();
    let price = '';
    if (priceMethod1 !== '') {
      price = priceMethod1;
    } else {
      price = priceMethod2;
    }
    const articlefulltext = $(el).find('div[class="woocommerce-product-details__short-description"] p').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const category = $(el).find('span[class="posted_in"]').contents().text()
      .trim()
      .replace(/Categories: |Category: /g, '');
    const tags = $(el).find('span[class="tagged_as"]').contents().text()
      .trim()
      .replace(/Tag: |Tags: /g, '');
    const text = `${title}\n${tags}`;
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
            price,
            articlefulltext,
            category,
            tags,
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
      name: 'thread',
      selector: ['tbody tr[class*="product_id_"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="summary entry-summary"]'],
      handler: postHandler,
    },
  ],
  1440,
);
