import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Hidden Wallet',
  type: SourceTypeEnum.FORUM,
  url: 'http://wallet2p25nr7pxvvkivm4j67us3hsb3admorpwjhqwpz3vljcqqb6yd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).text().split('Details')[0].split('details')[0].trim().replace(/[\t\n\s]+/g, ' ');
    const link = `http://wallet2p25nr7pxvvkivm4j67us3hsb3admorpwjhqwpz3vljcqqb6yd.onion/${$(el).find('a[class="productlink"]').attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="detailstext"]').text().split('Main Coins')[0].trim().replace(/[\t\n\s]+/g, ' ');
    const price = $(el).find('div[class="button"]').text().split('for')[1].trim();
    const articlefulltext = $(el).find('div[class="detailstext"]').contents().text()
      .split('View')[0].trim().replace(/[\t\n\s]+/g, ' ');
    const timestamp = moment().unix();
    posts.push(
      new Post(
        articlefulltext,
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
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="description"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
