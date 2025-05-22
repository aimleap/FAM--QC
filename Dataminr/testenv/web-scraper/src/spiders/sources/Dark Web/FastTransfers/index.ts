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
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Fast Transfers',
  type: SourceTypeEnum.FORUM,
  url: 'http://fast2cfkxyyzozcxh5jvogu7fclilq5oglagtr7ru4yvuzskwviv65qd.onion/',
};
async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="button"]:nth-child(4)').text().trim();
    const link = `http://fast2cfkxyyzozcxh5jvogu7fclilq5oglagtr7ru4yvuzskwviv65qd.onion/${
      $(el).find('a[class="button"]:nth-child(4)').attr('href')}`;
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
  const articlefulltext = $(elements)
    .find('div[class="content"]')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements)
    .find('li[class="active"]')
    .get()
    .slice(1, 5);
  entrySelector.forEach((ele) => {
    const title1 = $(ele).find('h2').text().trim();
    const entry = $(ele).find('+ li a').get().slice(0, 5);
    entry.forEach((el) => {
      const title = `${title1}: ${$(el).text().trim()}`;
      const price = $(el)
        .text()
        .trim()
        .split(/only|ONLY/)[1]
        .trim()
        .replace(/!/g, '');
      const timestamp = moment().unix();
      posts.push(
        new Post(
          title,
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
              articlefulltext,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
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
      name: 'main',
      selector: ['div[class="featured"]'],
      handler: mainHandler,
    },
    {
      name: 'post',
      selector: ['div[id="page"]'],
      handler: postHandler,
    },
  ],
  1440,
);
