import _ from 'lodash';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Dark Net Army Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://dna777ucpo4unwxrzw5mzs4iqm5qz3uepw3k5mvwbt7tnufryvsgy5yd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).get();
  entrySelector.forEach((el) => {
    const link1 = $(el).find('div[class="node-extra-row"] a[title]').attr('href');
    if (link1) {
      const link = `http://darknet77vonbqeatfsnawm5jtnoci5z22mxay6cizmoucgmz52mwyad.onion${link1}`;
      const title = $(el).find('h3[class="node-title"] a').text().trim();
      const timestamp = Number($(el).find('time').attr('data-time'));
      if (!title.includes('Porn')) {
        items.push({
          title,
          link,
          timestamp,
          delay: _.random(15, 30) * 1000,
          parserName: 'post',
        });
      }
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
  response: any,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const threadId = generateThreadId(title);
  const entrySelector = $(elements).find(`article[data-content="${id}"]`).get();
  entrySelector.forEach((el) => {
    const postnumber1 = $(el)
      .find(
        'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:nth-of-type(2) a',
      )
      .text()
      .trim();
    if (postnumber1) {
      const username = $(el).find('a[itemprop="name"]').text().trim();
      const articlefulltext = $(el)
        .find('div[class="bbWrapper"]')
        .find('blockquote')
        .remove()
        .end()
        .text()
        .replace(/[\t\n\s]+/g, ' ');

      const joinedDate = $(el)
        .find(
          'div[class="message-userExtras"] dl[class="pairs pairs--justified"]:nth-of-type(1) dd',
        )
        .text()
        .trim();
      const timestamp = Number($(el).find('time').attr('data-time'));

      let postNo = $(el)
        .find(
          'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:nth-of-type(3) a',
        )
        .text()
        .replace('#', '')
        .replace(',', '')
        .trim();
      if (!postNo) {
        postNo = $(el)
          .find(
            'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:nth-of-type(2) a',
          )
          .text()
          .replace('#', '')
          .replace(',', '')
          .trim();
      }
      const isFirstPost = parseInt(postNo, 10) === 1;
      const finalText = formatText(isFirstPost, title, articlefulltext, username);
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
              title,
              username,
              joined: joinedDate,
              parent_uuid: threadId,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="block block--category block--category1"] div[class="node-body"]'],
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
