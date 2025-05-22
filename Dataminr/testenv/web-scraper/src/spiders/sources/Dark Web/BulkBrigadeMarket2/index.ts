import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'BulkBrigade Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://bbrigadsmdb6blermzmpazyzm4xg7gg5j32feret6extsvovy622jxyd.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((ele) => {
    const title = $(ele).find('h4 a').text().trim();
    const articlefulltext = $(ele)
      .find('p[class="card-text"]')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const entrySelector = $(ele).find('ul li').get();
    entrySelector.forEach((el) => {
      const content = $(el)
        .text()
        .trim()
        .replace(/[\t\n\s]+/g, ' ');
      const price = content.split(' ')[1];
      const quantity = content.split(' ')[0];
      const timestamp = moment().unix();
      posts.push(
        new Post(
          `${title}\n${quantity}\n${price}`,
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
              quantity,
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
      name: 'post',
      selector: ['div[class="card-block"]'],
      handler: postHandler,
    },
  ],
  1440,
);
