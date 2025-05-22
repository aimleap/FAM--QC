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
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Bitify',
  type: SourceTypeEnum.FORUM,
  url: 'https://bitify.com/advanced-search/?sort=latest',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="title_holder"]').text().trim();
    const link = $(el).find('div[class="title_holder"] h2 a').attr('href');
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
  const items: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const price = $(elements).find('form[method="post"] li p[title="Price in USD"]').text().trim();
  const condition = $(elements).find('div[class="bid_panel"]:nth-of-type(2):nth-of-type(2) li p:nth-of-type(2)').text().trim();
  const ending = $(elements).find('div[class="bid_panel"]:nth-of-type(2):nth-of-type(2) li p:nth-of-type(3)').text().trim();
  const category = $(elements).find('div[class="bid_panel"]:nth-of-type(2):nth-of-type(2) li p:nth-of-type(4)').text().trim();
  const timestamp = moment().unix();
  items.push(
    new Post(
      `${title}; ${price}; ${condition}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          title,
          price,
          condition,
          ending,
          category,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="container-fluid"] div[class="post"]'],
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
