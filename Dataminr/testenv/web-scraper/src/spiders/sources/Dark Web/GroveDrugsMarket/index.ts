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
  name: 'Grove Drugs Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://vvihtmatx3vm2e2xqemt4voboed4jdys47757nkwslhodackwgynexid.onion/',
};

async function paginationHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 4; i++) {
    const link = `http://vvihtmatx3vm2e2xqemt4voboed4jdys47757nkwslhodackwgynexid.onion/page/${String(
      i,
    )}/index.html}`;
    const timestamp = moment().unix();
    items.push({
      title: '',
      link,
      parserName: 'thread',
      timestamp,
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
    const title = $(el).find('a[class*="LoopProduct"] h2').text().trim();
    const link = `http://vvihtmatx3vm2e2xqemt4voboed4jdys47757nkwslhodackwgynexid.onion/${$(
      el,
    )
      .find('a[class*="LoopProduct"]')
      .attr('href')}}`;
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
  const category = $(elements).find('span[class="posted_in"]').text().trim();
  const tags = $(elements).find('span[class="tagged_as"]').text().trim();
  const title = $(elements).find('h1').text().trim();
  const price = $(elements).find('p[class="price"]').text().trim();
  const articlefulltext = $(elements)
    .find('div[class="woocommerce-product-details__short-description"] p')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${title}\n${price}`,
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
          tags,
          articlefulltext,
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
      name: 'pagination',
      selector: ['*'],
      handler: paginationHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="products columns-4"] li'],
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
