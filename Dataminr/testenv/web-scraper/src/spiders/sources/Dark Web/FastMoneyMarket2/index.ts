import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Fast Money Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://fastmiudzuvs3utnwxuc7r7ujgwmdremn2cbjep43qohgc6k5m7noiyd.onion/',
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
    const productValue = $(el).find('h2').text().trim();
    const title = $(el).find('h3').text().trim();
    const price = $(el).find('p').text().trim()
      .split(':')[1];
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}\n${price}\n${productValue}`,
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
            productValue,
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
      selector: ['div[class="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
