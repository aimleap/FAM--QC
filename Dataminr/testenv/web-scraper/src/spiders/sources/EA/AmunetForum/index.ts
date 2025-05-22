import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Amunet Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://forum.amunet.io/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[data-xf-init="preview-tooltip"]').text().trim();
    const link = `https://forum.amunet.io/${$(el).find('div[class="structItem-cell structItem-cell--latest "] a[rel="nofollow"]').attr('href')}`;
    const timestamp = Number($(el).find('div[class="structItem-cell structItem-cell--latest "] time').attr('data-time'));
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
  const id = finalRedirectedUrl.split('post-')[1];
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const forum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-of-type(3) span').text().trim();
  const subforum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-of-type(4) span').text().trim();
  const entrySelector = $(elements).find(`article[data-content="post-${id}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('div[class="message-userDetails"] h4 a').contents().text()
      .trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    const articlefulltext = $(el).find(`div[data-lb-id="post-${id}"] div[class="bbWrapper"]`).contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const postnumber = $(el).find('ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a').last().text()
      .trim();
    posts.push(
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
            postnumber,
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
      selector: ['div[data-author]'],
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
