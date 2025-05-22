import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'MoneyPlus 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://6qp5s5lohjo56puebufgpamlb5rldtrpnfctwyexa3dausfyotdigkad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('a').get().slice(1, 4);
  entrySelector.forEach((el) => {
    const link = `http://6qp5s5lohjo56puebufgpamlb5rldtrpnfctwyexa3dausfyotdigkad.onion/${
      $(el).attr('href')}`;
    const title = $(el).text().trim();
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

  const title = $(elements).find('h5').text().trim();
  const timestamp = moment().unix();
  const price = $(elements).find('input[type="submit"]').attr('value');
  const articletext = $(elements)
    .find('ul[class="list-unstyled"]')
    .contents()
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  posts.push(
    new Post(
      title,
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
          articletext,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );

  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['ul[class="navigation-menu"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="card m-b-30"]'],
      handler: postHandler,
    },
  ],
  1440,
);
