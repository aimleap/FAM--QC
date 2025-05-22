import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'CCSeller',
  type: SourceTypeEnum.FORUM,
  url: 'http://yy72hbvispcyqrbwxzbxrmgfepxlzyu7s5qxxaj63l7nnnw4erhkqiid.onion/products.html',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('b:first').text().trim();
    const articlefulltext = $(el).find('p:first').text().trim();
    const price = $(el)
      .find('p:nth-of-type(2)')
      .clone()
      .find('del')
      .remove()
      .end()
      .text()
      .replace('Cost:', '')
      .split('\n')[0]
      .trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articlefulltext}\n${title}`,
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
            articlefulltext,
            price,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['tbody td:nth-of-type(2)'],
      handler: postHandler,
    },
  ],
  1440,
);
