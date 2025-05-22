import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Black&White Cards 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://nowx5ex3gc5h6b3pn46s4wpmcsp2w3toefck3rknunz3ghf22hulkqid.onion/products.html',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('article[  class="templatemo-item"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const price = $(el).find('strong').text().trim();
    const timestamp = moment().unix();
    const articlefulltext = $(el).find('ul li').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
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
          price,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
