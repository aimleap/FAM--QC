import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'Mazafaka Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://mfclubxckm7qv3bjee6dquzb4b3wbv3tnxhsuvjm2brx53vgacgp5ryd.onion/',
};
async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://mfclubxckm7qv3bjee6dquzb4b3wbv3tnxhsuvjm2brx53vgacgp5ryd.onion${$(el).find('a[data-nav-id="newPosts"]').attr('href')}`;
    const title = $(el).find('a[data-nav-id="newPosts"]').text().trim();
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp,
    });
  });
  return items;
}
async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="structItem-title"]').text().trim();
    const link = `http://mfclubxckm7qv3bjee6dquzb4b3wbv3tnxhsuvjm2brx53vgacgp5ryd.onion${$(el).find('a[href*="latest"]').attr('href')}`;
    const timestamp = Number($(el).find('a[href*="latest"] time').attr('data-time'));
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
  const items: Post[] = [];
  const forum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-child(4) a:nth-child(1) span').text().trim();
  const subforum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-child(3) a:nth-child(1) span').text().trim();
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const entrySelector = $(elements).find('div[class="message-user-inner"]:last').get();
  entrySelector.forEach((el) => {
    const timestamp = Number($(el).find('time[class="u-dt"]').attr('data-time'));
    const username = $(el).find('h4[class="message-name"]').contents().text()
      .trim();
    const joineddate = $(el).find('div[class="message-userExtras "] dl:nth-child(1)').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ':');
    const articlefulltext = $(el).find('div[class="message-content js-messageContent"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    items.push(
      new Post(
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
            forum,
            subforum,
            articlefulltext,
            username,
            joineddate,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['div[class="menu-content"]'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class*="structItem structItem--thread"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
