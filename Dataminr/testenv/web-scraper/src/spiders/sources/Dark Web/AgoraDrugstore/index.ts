import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Agora Drug Store',
  type: SourceTypeEnum.FORUM,
  url: 'http://3yugyknbuxezuzz5spfiv7vd6by6sdwnnss6rkw3wurultdhlucldiyd.onion/',
};

async function mainThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://3yugyknbuxezuzz5spfiv7vd6by6sdwnnss6rkw3wurultdhlucldiyd.onion/${$(el).find('a').attr('href')}`;
    const title = $(el).find('a').text().trim();
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
    const link = `http://3yugyknbuxezuzz5spfiv7vd6by6sdwnnss6rkw3wurultdhlucldiyd.onion${$(el).find('a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]').attr('href').replace('../../', '/')}`;
    const title = $(el).find('h2[class="woocommerce-loop-product__title"]').text().trim();
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
  const title = $(elements).find('h1[class="product_title entry-title"]').text().trim();
  let price = $(elements).find('div[class="summary entry-summary"] p[class="price"] ins span[class="woocommerce-Price-amount amount"]').text().trim();
  if (!price) {
    price = $(elements).find('div[class="summary entry-summary"] p[class="price"] span[class="woocommerce-Price-amount amount"]').text().trim();
  }
  const shortdescription = $(elements).find('div[class="woocommerce-product-details__short-description"]').contents().text()
    .replace(/(\r\n|\n|\r)/gm, '')
    .trim();
  const longdescription = $(elements).find('div[id="tab-description"]').contents().text()
    .replace(/(\r\n|\n|\r)/gm, '')
    .trim();
  const articletext = `${shortdescription} ${longdescription}`;
  const timestamp = moment().unix();
  posts.push(new Post(
    `${articletext}\n${title}`,
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
        articletext,
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
      name: 'main-thread',
      selector: ['ul[class="product-categories"] li'],
      handler: mainThreadHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="products columns-3"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
