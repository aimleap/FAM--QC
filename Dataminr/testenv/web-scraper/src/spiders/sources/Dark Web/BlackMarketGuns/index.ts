import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Weapons Market',
  isCloudFlare: false,
  name: 'Black Market Guns',
  type: SourceTypeEnum.FORUM,
  url: 'http://bmguns777mxlfnozjsfaeiyawspscqljaa4r7aohfmfydaqwbughptyd.onion/',
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i < 11; i++) {
    const link = `${source.url}?orderby=date&paged=${String(i)}`;
    items.push({
      title: '',
      link,
      parserName: 'thread',
      timestamp: moment().unix(),
    });
  }
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text();
    const link = $(el)
      .find('a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]')
      .attr('href');
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
  const articletext = $(elements).find('div[id="tab-description"] p').text().trim();
  const productName = $(elements).find('h1[class="product_title entry-title"]').text();
  const price = $(elements).find('div[class="summary entry-summary"] bdi').text().trim();
  const category = $(elements).find('span[class="posted_in"] a').text();
  const tag = $(elements)
    .find('span[class="tagged_as"] a')
    .map(function (this: any) {
      return $(this).text();
    })
    .get()
    .join(', ');
  const timestamp = moment().unix();
  const text = `${articletext}\n${productName}\n${tag}`;
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
          entity: productName,
          title: productName,
          price,
          companyName: productName,
          articletext,
          category,
          tags: tag,
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
      name: 'main',
      selector: ['*'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="products columns-3"] li'],
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
