import { Response } from 'request';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Carding MarketPlace',
  isCloudFlare: false,
  name: 'Black Bones Carding',
  type: SourceTypeEnum.FORUM,
  url: 'https://blackbones.net/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  const excludeCategories = ['Forum News', 'Community Scammers'];
  elements.forEach((el) => {
    const topicTitle = $(el).find('h3 a').text().trim();
    if (!excludeCategories.includes(topicTitle)) {
      const title = $(el).find('a[class="node-extra-title"]').text().trim();
      const link = `https://blackbones.net${$(el).find('a[class="node-extra-title"]').attr('href')}`;
      const timestamp = Number($(el).find('time').attr('data-time'));
      threads.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const items: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const forumsection = $(elements).find(' ul[class="p-breadcrumbs "] li:nth-child(2) a').text().trim();
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const entrySelector = $(elements).find(`article[data-content=${id}]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('span[class*="username"]').text().trim();
    const joined = $(el).find('div[class="message-userExtras"] dl:nth-child(1) dd').text().trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    const isFirstPost = $(el).find('ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a').text().trim() === '#1';
    $(el).find('div[class="bbWrapper"] blockquote').remove();
    const articlefulltext = $(el).find('div[class="bbWrapper"]').contents().text()
      .trim()
      .replace(/[\r\t\n\s]+/g, ' ');
    const finalText = formatText(isFirstPost, title, articlefulltext, username);
    const threadId = generateThreadId(title);
    const published = $(el).find('time').text().trim();
    items.push(
      new Post(
        finalText,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            username,
            joined,
            published,
            forumsection,
            parent_uuid: threadId,
            ingestpurpose: 'deepweb',
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
      name: 'thread',
      selector: ['div[class="node-body"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="p-body-inner"]'],
      handler: postHandler,
    },
  ],
  1440,
);
