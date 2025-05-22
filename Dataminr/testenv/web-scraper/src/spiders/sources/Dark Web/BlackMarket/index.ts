import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market Place',
  isCloudFlare: false,
  name: 'Black Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://573ic6qov7odiybhuujwbkd2jo3wcceimktbttpsqxf3dlgjkwpgz6id.onion/shop.php',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  const entrySelector = $(elements).find('div[class="one-third column"]').get();
  entrySelector.forEach((el) => {
    const title1 = $(el).find('h3[style="text-align:center;"]').text().trim();
    const description = $(el).find('p').contents().text()
      .trim();
    const price = $(el)
      .find('p+div span')
      .text()
      .trim()
      .replace('our price', '');
    const price2 = $(el).find('p+div span').text().trim();
    const timestamp = moment().unix();

    posts.push(
      new Post(
        `${title1}\n${description}\n${price2}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title1,
            item: title1,
            description,
            price,
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
