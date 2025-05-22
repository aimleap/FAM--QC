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
  description: 'Forums',
  isCloudFlare: false,
  name: 'Russian DarkNet Hub',
  type: SourceTypeEnum.FORUM,
  url: 'http://4n6enyz6oenoaqtmchbvippilm5zilps4apudlhw3ei7mcstzmj56fyd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];

  const filteredElements = elements.filter((el) => {
    const title = $(el).find('a[class="lastsubject"]').attr('title');
    return title !== undefined;
  });

  filteredElements.forEach((el) => {
    const title = $(el).find('a[class="lastsubject"]').attr('title');
    const link = `http://4n6enyz6oenoaqtmchbvippilm5zilps4apudlhw3ei7mcstzmj56fyd.onion${String(
      $(el).find('a[class="lastsubject"]').attr('href'),
    ).slice(1)}`;
    const timestamp = moment($(el).find('time').attr('datetime')).unix();
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
  const id = url.split('#')[1];
  const title = $(elements)
    .find('h2 a')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');

  const forums = $(elements)
    .find('ul[id="nav-breadcrumbs"] li span[class="crumb"]:nth-child(1) span')
    .text()
    .trim();
  const subforums = $(elements)
    .find('ul[id="nav-breadcrumbs"] li span[class="crumb"]:nth-child(2) span')
    .text()
    .trim();
  const entrySelector = $(elements).find(`div[id="${id}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el)
      .find('strong a[class="username"]')
      .contents()
      .text()
      .trim();
    const timestamp = moment($(el).find('time').attr('datetime')).unix();
    const articletext = $(el)
      .find('div[class="content"]')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    posts.push(
      new Post(
        articletext,
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
            forum: forums,
            subforum: subforums,
            username,
            articlefulltext: articletext,
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
      selector: ['ul[class="topiclist forums"] dd[class="lastpost"]'],
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
