import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'SunCrypt Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://nbzzb6sa6xuura2z.onion/',
};
async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((data) => {
    const $el = $(data);
    const title = $el.find('div.title.is-4 > a').text().trim();
    const hackedWebsite = $el.find('p.subtitle > a').text().trim();
    posts.push(
      new Post(
        title,
        {
          current_url: source.url,
        },
        moment().unix(),
        [],
        [],
        new Map(
          Object.entries({
            hackedWebsite,
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
      selector: ['div.card.mb-5'],
      handler: postHandler,
    },
  ],
  30,
);
