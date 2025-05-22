import moment from 'moment';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Millionaire Private Club',
  type: SourceTypeEnum.FORUM,
  url: 'http://millgp4qlunsodihsnbbofellqxvjg5kgikkwvpaolwxqqxcrjkfiwyd.onion/',
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
    const totalPCount = $(el).find('div[class="clearfix colelem"] p').length;
    let title = '';
    let price = '';
    if (totalPCount === 3) {
      price = $(el).find('div[class="clearfix colelem"] p:eq(2)').text().trim();
    } else {
      title = $(el).find('div[class="clearfix colelem"] p:eq(0)').text().trim();
      price = $(el).find('div[class="clearfix colelem"] p:eq(1)').text().trim();
    }
    const articlefulltext = `${title}\n${price}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articlefulltext}`,
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
      selector: ['div[class="shadow rounded-corners clearfix grpelem"]'],
      handler: postHandler,
    },
  ],
  1440,
);
