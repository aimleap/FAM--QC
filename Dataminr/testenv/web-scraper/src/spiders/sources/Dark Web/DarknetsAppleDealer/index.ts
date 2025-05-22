import moment from 'moment';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Darknets Apple Dealer',
  type: SourceTypeEnum.FORUM,
  url: 'http://applemskx6ax774zqwzbnhkevsywm4jfbwlmxzv35zaymvcxula7wiad.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const articletext = $(el)
      .find('p')
      .contents()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r|\t)/gm, '');
    const title = $(el).find('h2').text().trim();
    const date = $(el).find('span[class="news__date"]').text().trim();
    const timestamp = moment.utc(date, 'YYYY-MM-DD').unix();
    posts.push(
      new Post(
        title,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            articlefulltext: articletext,
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
      selector: ['div[class="news"]'],
      handler: postHandler,
    },
  ],
  1440,
);
