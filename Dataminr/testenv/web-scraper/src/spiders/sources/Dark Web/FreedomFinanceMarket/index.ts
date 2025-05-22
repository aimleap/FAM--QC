import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Web',
  isCloudFlare: false,
  name: 'Freedom Finance Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://freedomd2rm7quv5josvsx2kgd4guj6uboqeqs7pmlsmfiuxn5klt4ad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements)
    .find('ul li a')
    .get()
    .slice(2, 10)
    .concat($(elements).find('ul li a').get().slice(13, 15));
  entrySelector.forEach((el) => {
    const title = $(el).text().trim();
    const link = $(el).attr('href');
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
  _forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('strong').text().trim();
    const articlefulltext = $(el)
      .find('div[class="product-descr"]')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const price = $(el)
      .find('div[class="product-info product-price"]')
      .text()
      .replace('Price', '')
      .trim();
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
            articlefulltext,
            price,
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
      selector: ['ul[class="main-navigation"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="product-item"]'],
      handler: postHandler,
    },
  ],
  1440,
);
