import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Prima Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://2c3whwwpmnby37dp22uf7pin56yuj7tbthzhh4sp7fg3isjxsuya5cad.onion/index.php',
};

async function categoryHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a span').text().trim();
    const link = `http://2c3whwwpmnby37dp22uf7pin56yuj7tbthzhh4sp7fg3isjxsuya5cad.onion/${$(el).find('a').attr('href')}`;
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
    const link = `http://2c3whwwpmnby37dp22uf7pin56yuj7tbthzhh4sp7fg3isjxsuya5cad.onion/${$(el).find('h5 a').attr('href')}`;
    const title = $(el).find('h5 a').text().trim();
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
  const vendor = $(elements).find('h1').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const category = $(elements).find('ul li:nth-child(1) a').text().trim();
  const articlefulltext = $(elements).find('div[class="seller-description"] p:first-child').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('div[class="product-details"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h4').text().trim();
    const price = $(el).find('p[class="price"]').text().trim();
    const timestamp = moment().unix();
    posts.push(new Post(
      `${vendor}-${title}\n${price}`,
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
          vendor,
          category,
          price,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'category',
      selector: ['li[id*="main-menu-item-"]'],
      handler: categoryHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="panel-body text-center"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
