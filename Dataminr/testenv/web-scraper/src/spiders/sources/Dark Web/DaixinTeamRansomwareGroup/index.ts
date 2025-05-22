import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Daixin Team Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion/',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4').text().trim();
    const website = $(el).find('h4+h6 a').contents().text()
      .trim();
    const articletext = $(el)
      .find('p')
      .first()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}; ${articletext}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            domain: website,
            title,
            company: title,
            articlefulltext: articletext,
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
      selector: ['div[class="border border-warning card-body shadow-lg "]'],
      handler: postHandler,
    },
  ],
  1440,
);
