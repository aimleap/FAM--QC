import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'Promos Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://a463uoi5mbztrtopbjhfjxjbzd4xur2csuzqz4xrkih3tbegibqe2jqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = $(el).find('a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]').attr('href');
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
    const timestamp = moment().unix();
    const title = $(el).find('h1[class="product_title entry-title"]').contents().text()
      .trim();
    let price = $(el).find('p.price ins span[class="woocommerce-Price-amount amount"]').text().trim();
    if (!price) {
      price = $(el).find('p.price').text().trim();
    }
    const category = $(el).find('span[class="posted_in"]').contents().text()
      .replace('Category:', '')
      .trim();
    const tag = $(el).find('div[class="product_meta"] span[class="tagged_as"]').contents().text()
      .replace('Tags:', '')
      .trim();
    let articlefulltext = $(el).find('div[id="tab-description"] h3[class="product_title entry-title"]').contents().text()
      .replace('BitCOIN Wallet 0.02', '')
      .replace(/(BitCOIN Wallet \d+\.\d+)/g, '$1 ')
      .trim();
    if (!articlefulltext) {
      articlefulltext = $(el).find('div[id="tab-description"]:nth-child(2)').contents().text()
        .replace('Description', '')
        .trim()
        .replace(/[\t\n\s]+/g, ' ');
    }
    posts.push(
      new Post(
        `${title}\n${articlefulltext}`,
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
            tag,
            category,
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
      selector: ['li[class*="product type-product post-"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="page"]'],
      handler: postHandler,
    },
  ],
  1440,
);
