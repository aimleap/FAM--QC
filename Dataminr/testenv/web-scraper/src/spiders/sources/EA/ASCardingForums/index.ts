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
  name: 'ASCarding Forums',
  type: SourceTypeEnum.FORUM,
  url: 'https://ascarding.com/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="node-extra-title"]').attr('title');
    const link = `https://ascarding.com${$(el)
      .find('a[class="node-extra-title"]')
      .attr('href')}`;
    let timestamp = Number($(el).find('time').attr('data-time'));
    if (timestamp === undefined || null) {
      timestamp = moment().unix();
    }
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
  response: { request: { href: any } },
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const title = $(elements)
    .find('div[class="p-title "] h1')
    .contents()
    .text()
    .trim();
  const forums = $(elements)
    .find('ul[class="p-breadcrumbs "] li:nth-child(2) span')
    .text()
    .trim();
  const subforums = $(elements)
    .find('ul[class="p-breadcrumbs "] li:nth-child(3) span')
    .text()
    .trim();
  const entrySelector = $(elements).find(`article[data-content=${id}]`).get();
  entrySelector.forEach((el) => {
    const username = $(el)
      .find('div[class="message-userDetails"] h4 a')
      .contents()
      .text()
      .trim();
    const timestamp = Number(
      $(el).find('li[class="u-concealed"] time[class="u-dt"]').attr('data-time'),
    );
    const articletext = $(el)
      .find('div[class="bbWrapper"]')
      .contents()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r|\t)/gm, '');
    const postnumber = $(el)
      .find(
        'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a',
      )
      .text()
      .trim();
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
            articlefulltext: articletext,
            username,
            postnumber,
            forum: forums,
            subforum: subforums,
            ingestpurpose: 'deepweb',
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
      selector: ['div[class="node-extra"]'],
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
