import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'REvil Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://dnpscnbaix6nkwvystl3yxglz7nteicqrou3t75tpcc5532cztc46qyd.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((data) => {
    const $el = $(data);
    const title = $el.find('h2').text().trim();
    const postText = $el.find('div.item-body').text().trim();
    const postId = $el.find('div.blog-post.blog-main').attr('id');

    posts.push(
      new Post(
        postText,
        {
          current_url: source.url,
        },
        moment().unix(),
        [],
        [],
        new Map(
          Object.entries({
            post_id: postId,
            title,
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
      selector: ['div.blog-post-container'],
      handler: postHandler,
    },
  ],
  30,
);
