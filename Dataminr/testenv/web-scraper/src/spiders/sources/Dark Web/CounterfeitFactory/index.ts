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
  name: 'Counterfeit Factory',
  type: SourceTypeEnum.FORUM,
  url: 'http://countuwsuvizhn5xjfm7idrmzvzgtexuotkri2ln5nnkrlhm5uz4ieyd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = `http://countuwsuvizhn5xjfm7idrmzvzgtexuotkri2ln5nnkrlhm5uz4ieyd.onion/${
      $(el).find('a').attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
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
  const title = $(elements).find('h2 span:first').text().trim();
  const price = $(elements)
    .find('div[class="product-info-price"] a')
    .text()
    .trim();
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
      selector: ['div[class="content-left-top-brands"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: [
        'div[class="content product-box-main"] [class*="product-grid fade"]',
      ],
      handler: postHandler,
    },
  ],
  1440,
);
