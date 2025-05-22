import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Black & White cloned Cards',
  type: SourceTypeEnum.FORUM,
  url: 'http://gocdtut4ifuafvbrlzctlbluauitblbogkfaxszj4qkluekfpqltzyyd.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((ele) => {
    const mainTitle = $(ele).find('h4').text().trim();
    const entrySelector = $(ele).find('p').get();
    entrySelector.forEach((el) => {
      const title = `${$(el).find('strong').text().trim()}`;
      const price = $(el).text().trim().split('value: ')[1];
      const articletext = `${mainTitle} ${title}`;
      const timestamp = moment().unix();
      posts.push(
        new Post(
          `${articletext}\n${price}`,
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
              price,
              articlefulltext: articletext,
              ingestpurpose: 'darkweb',
              parse_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    });
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['td[style="text-align: center;"]'],
      handler: postHandler,
    },
  ],
  1440,
);
