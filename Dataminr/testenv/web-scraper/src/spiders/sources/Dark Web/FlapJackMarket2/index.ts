import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Flap Jack Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://lawawntmszs2chjogidixm64nmvo6qy4jyecdaknahoqxh2edixlwqyd.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('div[class="pack"] h2').text().split('buy')[1].trim();
  const articlefulltext = $(elements).find('div[class="pack"]').contents().text()
    .trim();
  const entrySelector = $(elements).find('section[class="plan cf"] label').get();
  entrySelector.forEach((el) => {
    const price = $(el).text().split('grams')[1].trim();
    const quantity = `${$(el).text().split('grams')[0].trim()}grams`;
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
            price,
            quantity,
            articlefulltext,
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
      selector: ['div[class="container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
