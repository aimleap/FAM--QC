import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: '4Cheat Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://4cht.com/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const includeForums = ['Халява/Раздачи', 'Онлайн товары/услуги'];
  elements.forEach((el) => {
    const mainForum = $(el).find('h3 a').text().trim();
    if (includeForums.includes(mainForum)) {
      const title = $(el).find('a[class="node-extra-title"]').attr('title');
      const link = `https://4cht.com${$(el).find('a[class="node-extra-title"]').attr('href')}`;
      const timestamp = Number($(el).find('time').attr('data-time'));
      items.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const title = $(elements).find('h1[class="p-title-value"] span').text().trim();
  const forumSection = $(elements).find('ul[class="p-breadcrumbs "] li:nth-of-type(3) span').text().trim();
  const entrySelector = $(elements).find(`article[data-content="${id}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('div[class="message-userDetails"] h4 a').contents().text()
      .trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    $(el).find('div[class="bbWrapper"] blockquote').remove();
    const articlefulltext = $(el).find(`div[data-lb-id="${id}"] div[class="bbWrapper"]`).contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const isFirstPost = $(el).find('ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a').last().text()
      .trim() === '#1';
    const finalText = formatText(isFirstPost, title, articlefulltext, username);
    const joined = $(el).find('div[class="message-userExtras"] dl:first-child dd').text().trim();
    const threadId = generateThreadId(title);
    posts.push(
      new Post(
        finalText,
        {
          current_url: finalRedirectedUrl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            username,
            title,
            joined,
            forumSection,
            parent_uuid: threadId,
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
      selector: ['div[class*="block block--category"] div[class="node-body"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="p-body"]'],
      handler: postHandler,
    },
  ],
  1440,
);
