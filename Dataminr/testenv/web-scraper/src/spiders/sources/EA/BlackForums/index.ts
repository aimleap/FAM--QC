import _ from 'lodash';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'BlackForums',
  type: SourceTypeEnum.FORUM,
  url: 'https://blackforums.net/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `https://blackforums.net${$(el).find('a[class="node-extra-title"]').attr('href')}`;
    const title = $(el).find('a[class="node-extra-title"]').text().trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    if (title === '') {
      return;
    }
    items.push({
      title,
      link,
      parserName: 'post',
      delay: _.random(15, 30) * 1000,
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
  const id = url.split('post-')[1];
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const forum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-child(2) a span').text().trim();
  const subforum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-child(3) a span').text().trim();
  const entrySelector = $(elements).find(`article[data-content="post-${id}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('div[class="message-userDetails"] h4').contents().text()
      .trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    const messages = $(el).find('dl:nth-child(2) dd').text().trim();
    const articlefulltext = $(el).find('div[class="bbWrapper"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const postnumber = $(el).find('ul[class*="message-attribution-opposite message-attribution-opposite--list"] li:last-child a').text().trim();
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
            postnumber,
            messages,
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
      selector: ['div[id="top"]'],
      handler: postHandler,
    },
  ],
  1440,
);
