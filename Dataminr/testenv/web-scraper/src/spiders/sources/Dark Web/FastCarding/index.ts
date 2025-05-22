import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Fast Carding',
  type: SourceTypeEnum.FORUM,
  url: 'http://imr6xtyr6f7wcwaegydbdkquuuhceol2qtu6rjdhf74d4dszs2hnvcad.onion/',
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
    const articlefulltext = $(el)
      .find('div[class="description"]')
      .contents()
      .text()
      .trim();
    const title = $(el).find('h2').text().trim();
    const price = $(el).find('div[class="price"] strong').text().trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}\n${price}\n${articlefulltext}`,
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
      selector: ['ul[class="list"] li'],
      handler: postHandler,
    },
  ],
  1440,
);
