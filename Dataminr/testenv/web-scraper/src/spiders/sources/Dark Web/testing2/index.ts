import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: '420prime Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://ajlu6mrc7lwulwakojrgvvtarotvkvxqosb4psxljgobjhureve4kdqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const articlefulltext = $(elements)
    .find('div[id="main"]')
    .text()
    .replace(/[\t\n\s]+/g, ' ')
    .split('Product Price')[0];
  const entrySelector = $(elements).find('table[class="table1"] tr').get().slice(1);
  entrySelector.forEach((el) => {
    const title = $(el).find('td:first-child').text().trim();
    const price = $(el).find('td:nth-child(2)').text().trim();
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
            ProductName: title,
            price,
            articlefulltext,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
