import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Advanced Crypto stealer',
  type: SourceTypeEnum.FORUM,
  url: 'http://7mhxu6fbn7ej4vio3nvqw65vff2j5ezlcbs6o4pp6w7crgd4wsvuwdad.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="bg-white p-5 rounded-lg shadow"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h1[class="h3 text-uppercase font-weight-bold mb-4"]').text().trim();
    const price = $(el).find('h2[class="h1 font-weight-bold"]').text().trim();
    const articlefulltext = $(el).find('ul li[class="mb-3"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = moment().unix();
    posts.push(new Post(
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
          ProductName: title,
          price,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['div[class="row text-center align-items-end"]'],
      handler: postHandler,
    },
  ],
  1440,
);
