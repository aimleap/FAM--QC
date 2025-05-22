import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Dumps Buy Store',
  type: SourceTypeEnum.FORUM,
  url: 'http://tnq625oifezprmaqyxwxrb6bcqx4uzz2eoivrjctsplj2ypp2bkhzsid.onion/index.html',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = `http://tnq625oifezprmaqyxwxrb6bcqx4uzz2eoivrjctsplj2ypp2bkhzsid.onion/${$(
      el,
    )
      .find('a')
      .attr('href')}`;
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
): Promise<Post[]> {
  const posts: Post[] = [];

  const title = $(elements)
    .find('p[class="name product-title"] a')
    .text()
    .trim();
  const link = encodeURI(
    `http://tnq625oifezprmaqyxwxrb6bcqx4uzz2eoivrjctsplj2ypp2bkhzsid.onion${
      $(elements)
        .find('p[class="name product-title"] a')
        .attr('href')
        .split('../..')[1]
    }`,
  );
  const category = $(elements).find('p[class*="category"]').text().trim();
  let price = $(elements)
    .find(
      'div[class="price-wrapper"] span[class="price"] ins span[class="woocommerce-Price-amount amount"]',
    )
    .text()
    .trim();
  if (price === '') {
    price = $(elements)
      .find(
        'div[class="price-wrapper"] span[class="price"] span[class="woocommerce-Price-amount amount"]',
      )
      .text()
      .trim();
  }
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${title}\n${price}`,
      {
        current_url: link,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          category,
          price,
          articlefulltext: title,
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
      selector: ['ul[class="product-categories"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class*="product-small box"]'],
      handler: postHandler,
    },
  ],
  1440,
);
