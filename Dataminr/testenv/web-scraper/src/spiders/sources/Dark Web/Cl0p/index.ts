import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Cl0p Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://ekbgzchl6x2ias37.onion',
};

export function getLists($: CheerioSelector, $ele: Cheerio) {
  const domainList: string[] = [];
  let leakList: string[] = [];
  const $leak = $ele.find('.nav a').get();
  $leak.forEach((m) => {
    const message = $(m).text().trim();
    leakList.push(message);
  });
  const $el = $('div.cell blockquote p:first-child').text().split('\n');
  $el.forEach((e) => {
    domainList.push(e);
  });
  leakList = leakList.filter((el) => el !== 'HOME' && el !== 'HOW TO DOWNLOAD?' && el !== '');
  const set = new Set(leakList);
  domainList.forEach((item) => set.add(item));
  return Array.from(set);
}

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((data) => {
    const $ele = $(data);
    const postContent = getLists($, $ele);
    postContent.forEach((message) => {
      posts.push(
        new Post(
          message,
          {
            current_url: source.url,
          },
          moment().utc().unix(),
        ),
      );
    });
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div.site-body'],
      handler: postHandler,
    },
  ],
  20,
);
