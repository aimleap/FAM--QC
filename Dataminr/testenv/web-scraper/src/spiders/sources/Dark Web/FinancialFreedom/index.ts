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
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'Financial Freedom',
  type: SourceTypeEnum.FORUM,
  url: 'http://freedom7zmzbk62agjmg4qo6gmoymej2bibjtqvb46p3yfehqcbyojqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('ul[class="main-navigation"] li a').get().slice(2, 16);
  entrySelector.forEach((el) => {
    const link1 = $(el).attr('href');
    if (link1.includes('http')) {
      const title = $(el).text().trim();
      const link = $(el).attr('href');
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
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
  const entrySelector = $(elements).find('div[class="product-item"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="product-info"] strong').text().trim();
    const articlefulltext = $(el).find('div[class="product-descr"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const price = $(el).find('div[class="product-info product-price"]').text().split(' ')[1];
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
      selector: ['div[class="container"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
