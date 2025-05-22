import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'LordPay Transfers',
  type: SourceTypeEnum.FORUM,
  url: 'http://lordpgjtif7h4autbzelhqvdnghuoyneevsq5uzr3ohbh3n356334qyd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="thumbnail index"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h4').text().trim();
    const price = $(el).find('p[class="tag"]').text().trim();
    const timestamp = moment().unix();
    const articlefulltext = $(el).find('p[class="text_column"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    posts.push(new Post(
      title,
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
