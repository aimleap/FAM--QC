import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Midland City Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://mcityef3eueeh26mo2e7jn6yypgnvtbu2w57kcka6g3zu7u4xv5cgkid.onion/',

};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="item"]').text().trim();
    const articletext = $(el).find('div[class="item3"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const price = $(el).find('div[class="item2"]').contents().text()
      .trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${articletext}\n${title}`,
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
            articletext,
            price,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="cell"]'],
      handler: postHandler,
    },
  ],
  1440,
);
