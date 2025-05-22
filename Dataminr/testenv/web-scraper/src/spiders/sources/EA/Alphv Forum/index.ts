import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Alphv Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://alphv.ru/',
  randomDelay: [10, 15],
  injectHeaders: true,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const excludeForums = ['Форум'];
  elements.forEach((el) => {
    const mainTopic = $(el).find('a[class="uix_categoryTitle"]').text().trim();
    if (!excludeForums.includes(mainTopic)) {
      const entrySelector = $(el).find('div[class="node-extra"]').get();
      entrySelector.forEach((ele) => {
        const title = $(ele).find('a[class="node-extra-title"]').text().trim();
        const link = `https://alphv.ru${$(ele).find('a[class="node-extra-title"]').attr('href')}`;
        const timestamp = moment().unix();
        items.push({
          title,
          link,
          parserName: 'post',
          timestamp,
        });
      });
    }
  });
  return items;
}

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const forumsection = $(elements)
    .find('ul[class="p-breadcrumbs "] li:last-child span')
    .text()
    .trim();
  const entrySelector = $(elements)
    .find(
      'div[class="block-body js-replyNewMessageContainer"] article[data-content*="post-"]:last-child',
    )
    .get();
  entrySelector.forEach((el) => {
    $(el).find('div[class="bbWrapper"] blockquote').remove();
    const username = $(el).find('div[class="message-userDetails"] h4').contents().text()
      .trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    const joined = $(el)
      .find('div[class="message-userExtras"] dl[class="pairs pairs--justified"]:nth-of-type(1) dd')
      .first()
      .text()
      .trim();
    const articlefulltext = $(el)
      .find('div[class="bbWrapper"]')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const postUrl = `https://alphv.ru${$(el)
      .find(
        'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a',
      )
      .attr('href')}`;
    const isFirstPost = $(el)
      .find(
        'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a',
      )
      .text()
      .trim() === '#1';
    const threadId = generateThreadId(title);
    const finalText = formatText(isFirstPost, title, articlefulltext, username);
    posts.push(
      new Post(
        finalText,
        {
          current_url: postUrl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            username,
            joined,
            title,
            forumsection,
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
      selector: ['div[class*="block block--category block--category"]'],
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
