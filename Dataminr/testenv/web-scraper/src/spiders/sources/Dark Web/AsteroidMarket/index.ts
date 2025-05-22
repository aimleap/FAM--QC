import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: 'Asteroid Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://astrox4syccq4zxaogcw6pk7av5ogblk4lyliwpsmhqmfi5go7becbyd.onion/',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .attr('href')
      .split('/product-category/')[1]
      .split('/')[0];
    const link = `http://astrox4syccq4zxaogcw6pk7av5ogblk4lyliwpsmhqmfi5go7becbyd.onion${
      $(el).attr('href').trim()}`;
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
    const title = $(el).find('a').text().trim();
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
  forumPaths: String[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const price = $(elements).find('p[class="price"] bdi').text().trim();
  const category = $(elements).find('span[class="posted_in"] a').text().trim();
  const tags = $(elements).find('span[class="tagged_as"] a').text().trim();
  const articlefulltext = $(elements)
    .find('div[id="tab-description"] p')
    .text()
    .trim();
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${articlefulltext}\n${title}\n${tags}`,
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
          ProductName: title,
          price,
          category,
          tags,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      name: 'main',
      selector: ['div[class="elementor-image"] a[href*="category"]'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['h2[class="jet-woo-product-title"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
