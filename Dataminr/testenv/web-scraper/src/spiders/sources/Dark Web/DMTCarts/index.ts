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
  isCloudFlare: true,
  name: 'DMT Carts',
  type: SourceTypeEnum.FORUM,
  url: 'http://dmtcafexbpdiuk42h3r6comkoq7cvgjcamtwcuh2ohsswskn5guciuqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a:nth-child(1)').attr('href');
    const title = $(el).find('h2').text().trim();
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
  const title = $(elements)
    .find('h1[class="product_title entry-title"]')
    .text()
    .trim();
  const price = $(elements)
    .find('p[class="price"] ins bdi')
    .contents()
    .text()
    .trim();

  const category = $(elements).find('span[class="posted_in"] a').text().trim();
  const articlefulltext = $(elements)
    .find('div[id="tab-description"] p:nth-of-type(1)')
    .text()
    .trim();
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${title}\n${articlefulltext}\n${price}`,
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
          category,
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
      selector: ['ul[class="products columns-3"] li'],
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
