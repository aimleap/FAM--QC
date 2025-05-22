import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'pay2key',
  type: SourceTypeEnum.FORUM,
  url: 'http://pay2key2zkg7arp3kv3cuugdaqwuesifnbofun4j6yjdw5ry7zw2asid.onion',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    try {
      const $el = $(el);
      const message = $el.find('div.inner').text().trim();
      const link = $el.find('h3 a').attr('href') || '';
      const timestamp = moment.utc().unix();
      posts.push(
        new Post(
          message,
          {
            current_url: `${source.url}${link.replace('./', '/')}`,
          },
          timestamp,
        ),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div.articles div.article'],
      handler: postHandler,
    },
  ],
  25,
);
