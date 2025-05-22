import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Clay Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://zuf7xa6ut5cbwxkmirslyb7g3wcrklkdukgvpyw37uqbo7igbvbkbnqd.onion/hidden_services.html',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://zuf7xa6ut5cbwxkmirslyb7g3wcrklkdukgvpyw37uqbo7igbvbkbnqd.onion${$(el).find('a').attr('href').slice(1)}`;
    const title = $(el).find('a').text().trim();
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
  const title = $(elements).find('div[class="updated"] p:first-child').contents().text()
    .trim();
  const entrySelector = $(elements).find('tr[class="selected-row"]').get();
  entrySelector.forEach((el) => {
    const vendor = $(el).find('td:nth-child(2)').text().trim();
    const balance = $(el).find('td:nth-child(3)').text().trim();
    const cardType = $(el).find('td:nth-child(4)').text().trim();
    const price = $(el).find('td:nth-child(6)').text().trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title} ${cardType}\n${price}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title: `${title} ${cardType}`,
            balance,
            price,
            vendor,
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
      selector: ['div[class="hidden_services"] ul li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
