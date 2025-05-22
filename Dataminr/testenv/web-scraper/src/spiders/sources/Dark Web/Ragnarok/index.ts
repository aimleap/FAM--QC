import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'ragnarok',
  type: SourceTypeEnum.FORUM,
  url: 'http://wobpitin77vdsdiswr43duntv6eqw4rvphedutpaxycjdie6gg3binad.onion',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    try {
      const $el = $(el);
      const message = $el.find('div.post-content p').text().trim();
      const profileLink = $el.find('div.post-title a').attr('href') || '';
      const profileName = $el.find('div.post-title a').text();
      const timestamp = moment
        .utc($el.find('div.post-time').text(), 'YYYY-MM-DDTHH:mm:ssSSZ')
        .unix();
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: profileLink,
            current_url: source.url,
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
      selector: ['div.post-entry'],
      handler: postHandler,
    },
  ],
  25,
);
