import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Nefilim Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://hxt254aygrsziejn.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((data) => {
    const $el = $(data);
    const headline = $el.find('h2.entry-title > a').text().trim();
    const message = $el.find('div.entry-summary > p').text().trim();
    const url = $el.find('h2.entry-title > a').attr('href').trim();
    const posttime = $el.find('time.entry-date').attr('datetime').trim();
    const timestamp = moment.utc(posttime, 'YYYY-MM-DDTHH:mm:ssZ').unix();
    posts.push(
      new Post(
        message,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title: headline,
            post_url: url,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div.site-content article'],
      handler: postHandler,
    },
  ],
  20,
);
