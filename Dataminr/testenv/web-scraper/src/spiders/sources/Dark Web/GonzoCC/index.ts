import moment from 'moment';
import _ from 'lodash';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Cards',
  isCloudFlare: false,
  name: 'Gonzo CC',
  type: SourceTypeEnum.FORUM,
  url: 'http://dizrpdkx2vbloz36t34h4bcundvobmecmwcxvxiyxoetd4hvsbymwhid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a h2').text().trim();
    const link = $(el).find('a').attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      delay: _.random(15, 30) * 1000,
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
  const timestamp = moment().unix();
  const title = $(elements)
    .find('div[class="summary entry-summary"] h1')
    .text()
    .trim();
  const price = $(elements).find('p[class="price"] span').text().trim();
  const articlefulltext = $(elements)
    .find('div[id="tab-description"] p')
    .text()
    .trim();
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
      name: 'thread',
      selector: ['div[class="thunk-product-content"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="primary-content-area"]'],
      handler: postHandler,
    },
  ],
  1440,
);
