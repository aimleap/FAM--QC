import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Anonymous Hackers Service',
  type: SourceTypeEnum.FORUM,
  url: 'http://twcd7fo4eepxznx7vajl5njkfpkz3g3z6qhynffcy3hb6n42dov2omid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4[class="title"]').text().trim();
    const articlefulltext = $(el).find('p').text().trim();
    const timestamp = moment().unix();
    posts.push(new Post(
      `${articlefulltext}\n${title}`,
      {
        current_url: source.url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[id="content"] div[class="cv-section-item"]'],
      handler: postHandler,
    },
  ],
  1440,
);
