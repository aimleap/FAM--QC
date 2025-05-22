import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'TOR Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://torsxddidcllfbgrfwhpeeaswjto53rp47zvyrohrjnc6x7vab2pqfid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text();
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
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="thunk-product-wrap"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="thunk-product-content"] h2').text().trim();
    const link = $(el).find('div[class="thunk-product-content"] a').attr('href');
    const price = $(el).find('div[class="thunk-product-content"] span[class="price"]').text().trim();
    const articlefulltext = $(el).find('div[class="thunk-product-hover"] p').text().trim()
      .replace(/[\t\n\s]+/g, ' ')
      .replace(`${$(el).find('div[class="thunk-product-hover"] p span').text().trim()}`, '');
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
            price,
            articlefulltext,
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
      selector: ['ul[class="product-categories"] li'],
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
