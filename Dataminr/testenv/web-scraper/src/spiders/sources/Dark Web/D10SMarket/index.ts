import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: true,
  name: 'D10S Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://diego62ruyl6rbz7okibq5qfhmww6psvp27dsfs2o62xrifpardmg5yd.onion/',
  requestOption: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    },
  },
};

async function paginationHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).attr('href');
    const title = $(el).find('h3').text().trim();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp: moment().unix(),
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
    const title = $(el).find('img').attr('alt');
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
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h2').text().trim();
  const vendor = $(elements).find('div[class="soldby"]').text().split(':')[1].trim();
  const price = $(elements)
    .find('span[class="product-based"]')
    .text()
    .split(':')[1]
    .split('\n')[0]
    .trim();
  const description = $(elements).find('p[class="product-description"]').text();
  const text = `${title}\n${price}`;
  const timestamp = moment().unix();
  posts.push(
    new Post(
      text,
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
          description,
          price,
          vendor,
          ingestpurpose: 'darkweb',
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
      name: 'pagination',
      selector: ['div[class="categories"] a '],
      handler: paginationHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="card_c"] a[class="nd"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="product"] '],
      handler: postHandler,
    },
  ],
  1440,
);
