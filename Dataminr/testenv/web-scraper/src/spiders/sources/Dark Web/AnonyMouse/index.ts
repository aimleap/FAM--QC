import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'AnonyMouse',
  type: SourceTypeEnum.FORUM,
  url: 'http://tnljfdfrrwltf4iakiy2u3zbjocz3grkjiv3o5soqont6rb7bi4ccvqd.onion/',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a').attr('href');
    const title = $(el).find('a').attr('title');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp,
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="product-info-wrap info"] a:first').attr('title');
    const link = $(el).find('div[class="product-info-wrap info"] a:first').attr('href');
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
  const entrySelector = $(elements).find('div[class="product-page"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h1[class="product_title entry-title"]').text().trim();
    let price = $(el).find('ins span[class="woocommerce-Price-amount amount"]').text().trim();
    if (price === '') {
      price = $(el).find('p[class="price nasa-single-product-price"]').text().trim();
    }
    const description = $(el).find('div[id="nasa-tab-description"]').contents().text()
      .trim();
    const category = $(el).find('span[class="posted_in"] a').text().trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}`,
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
            articlefulltext: description,
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
      name: 'main',
      selector: ['ul[class="vertical-menu-wrapper"] li'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="nasa-content-page-products"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
