import { Response } from 'request';
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
  name: 'b1nd.net',
  type: SourceTypeEnum.FORUM,
  url: 'http://b1nd.net/whats-new/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="structItem-title"] a').text().trim();
    const link = `http://b1nd.net${
      $(el)
        .find(
          'div[class="structItem-cell structItem-cell--latest"] a[rel="nofollow"]',
        )
        .attr('href')}`;
    const timestamp = Number($(el).find('time').attr('data-time'));

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
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const title = $(elements).find('div[class="p-title "] h1').text().trim();
  const forumsection = $(elements)
    .find('ul[class="p-breadcrumbs "] li:nth-of-type(2) a span')
    .text()
    .trim();
  const entrySelector = $(elements)
    .find('div[class="message-inner"]:last')
    .get();
  entrySelector.forEach((el) => {
    const username = $(el)
      .find('a[class="username "] span')
      .contents()
      .text()
      .trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    const articlefulltext = $(el).find('article[class="message-body js-selectToQuote"] div div[class="bbWrapper"]').clone().find('blockquote.bbCodeBlock')
      .remove()
      .end()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .replace(/{[^}]*}/g, '')
      .trim();

    const postId = $(el).find('ul[class="message-attribution-opposite message-attribution-opposite--list "] li:nth-of-type(2) a').text().replace('#', '')
      .trim();

    let text = '';
    if (parseInt(postId, 10) > 1) {
      text = `${username} : ${articlefulltext}`;
    } else {
      text = `${username} : ${title}, ${articlefulltext}`;
    }

    posts.push(
      new Post(
        text,
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
            forumsection,
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
      selector: [
        'div[data-widget-key="whats_new_new_posts"] div[class*="structItem structItem--thread js-inlineModContainer"]',
      ],
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
