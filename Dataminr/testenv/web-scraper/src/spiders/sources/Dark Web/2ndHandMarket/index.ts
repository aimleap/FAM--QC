import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: '2ndHand Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://2ndhandhihws23rmd7ubakgxutp5ixddx6sbnehhmj4i2c6er4l7o4qd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = source.url + $(el).find('a').attr('href');
    const date = $(el).find('span[class="time"]').text().trim();
    const timestamp = moment.utc(date, 'YYYY-MM-DD').unix();
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
  const title = $(elements).find('div[class="title"]').text().trim();
  const price = $(elements).find('div[class="price"]').text().trim();
  const tags = $(elements).find('div[class="tags"]').contents().text()
    .trim();
  const articlefulltext = $(elements).find('div[class="description"]').contents().text()
    .trim();
  const seller = $(elements).find('div[class="seller"]').text().trim();
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
          price,
          tags,
          seller,
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
      selector: ['div[class="left last-products"] div[class="item"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="product-detail"]'],
      handler: postHandler,
    },
  ],
  1440,
);
