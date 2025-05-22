import moment from 'moment';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Merida',
  type: SourceTypeEnum.FORUM,
  url: 'http://kemldgom3jujt32isp5nra5kl6b47xkd65o5axp5x7ulqj4x4eqnz2ad.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="column mcb-column one-third column_our_team"]').get().slice(3);
  entrySelector.forEach((el) => {
    const title = `${$(el).find('img').attr('src').split('/')[1].split('.')[0]} ${$(el).find('h4').text().trim()}`;
    const price = $(el).find('p strong').text().trim()
      .split(': ')[1];
    const articlefulltext = $(el).find('div[class="desc"]').text().trim();
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
