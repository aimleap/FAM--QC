import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'BlackMart',
  type: SourceTypeEnum.FORUM,
  url: 'http://blackma333zetynnrblc7uidfp2tewhtwpojxxvmty3n4cdsc7iyukad.onion/products.php',
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 5; i++) {
    items.push({
      title: '',
      link: `${source.url}?category=All&page=${String(i)}/`,
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
    const title = $(el).find('a+a').text().trim();
    const link = `http://blackma333zetynnrblc7uidfp2tewhtwpojxxvmty3n4cdsc7iyukad.onion/${$(el).find('a+a').attr('href')}`;
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp: moment().unix(),
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
  const entrySelector = $(elements).find('div[class="container"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    if (title) {
      const title1 = $(el).find('h2').text().trim();
      const soldby = $(el).find('div[class="col-md-2"] a[class="soldByHref"]').text().trim();
      const fulldescription = $(el).find('div[class="col-md-5"]').clone().find('div[class="buyer-protection"]')
        .remove()
        .end()
        .text()
        .trim();
      const description = $(el).find('div[class="m-b-10px"]').contents().text()
        .trim()
        .replace('Product Description:', '');
      const price = $(el).find('h4[class="m-b-10px price-description"]').clone().find('span[class="mrp-offer-child"]')
        .remove()
        .end()
        .text()
        .trim();
      const timestamp = moment().unix();
      posts.push(new Post(
        `${title1}\n${fulldescription}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title1,
            item: title1,
            description,
            price,
            soldby,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ));
    }
  });

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
      selector: ['div[class="product-list-inside"]'],
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
