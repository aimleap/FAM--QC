import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Ranzy',
  type: SourceTypeEnum.FORUM,
  url: 'http://37rckgo66iydpvgpwve7b2el5q2zhjw4tv4lmyewufnpx4lhkekxkoqd.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    try {
      const $el = $(el);
      const message = $el.find('h3.mb-3').text().trim();
      const targetDetails = $el.find('p.mb-3').text().trim();
      const timestamp = moment.utc().unix();
      posts.push(
        new Post(
          message,
          {
            current_url: source.url,
          },
          timestamp,
          [],
          [],
          new Map([['targetDetails', targetDetails]]),
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
      selector: ['div.col.py-3'],
      handler: postHandler,
    },
  ],
  25,
);
