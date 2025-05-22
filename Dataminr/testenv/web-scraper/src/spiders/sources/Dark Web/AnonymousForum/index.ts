import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Anonymous Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://vmnalmrauqbcsdatbadpa6fajjtfs2kuhzd63ppyuu22g6kya5zu64qd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://vmnalmrauqbcsdatbadpa6fajjtfs2kuhzd63ppyuu22g6kya5zu64qd.onion/${$(el).attr('href').split('/')[1]}`;
    const timestamp = moment().unix();
    items.push({
      title: '',
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
  const id = url.split('#p')[1];
  const title = $(elements).find('h2 a').text().trim();
  const forum = $(elements).find('li[class="breadcrumbs"] span:nth-child(2) span').text().trim();
  const subforum = $(elements).find('li[class="breadcrumbs"] span:nth-child(3) span').text().trim();
  const username = $(elements).find(`dl[id="profile${id}"] a[class="username"]`).contents().text()
    .trim();
  const timestamp = moment($(elements).find(`div[id="p${id}"] time`).attr('datetime')).unix();
  const articlefulltext = $(elements).find(`div[id="post_content${id}"] div[class="content"]`).contents().text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
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
          forum,
          subforum,
          articlefulltext,
          username,
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
      selector: ['dd[class="forum-stats"] span a'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="wrap"]'],
      handler: postHandler,
    },
  ],
  1440,
);
