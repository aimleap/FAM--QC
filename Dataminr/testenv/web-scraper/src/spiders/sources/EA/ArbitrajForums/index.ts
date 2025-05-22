import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Arbitraj Forums',
  type: SourceTypeEnum.FORUM,
  url: 'https://arbitraj-forum.ru/',
  entryUrl: 'index.php/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="node-extra-title"]').attr('title');
    const link = `https://arbitraj-forum.ru${$(el).find('a[class="node-extra-title"]').attr('href')}`;
    const timestamp = Number($(el).find('time').attr('data-time'));
    if (timestamp) {
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
  const id = url.split('post-')[1];
  const finalRedirectedUrl = response.request.href;
  const title = $(elements).find('div[class="p-title "] h1').text().trim();
  const forum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-child(3) span').text().trim();
  const subforum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-child(4) span').text().trim();
  const entrySelector = $(elements).find(`article[data-content="post-${id}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('div[class="message-userDetails"] h4 a').contents().text()
      .trim();
    const timestamp = Number($(el).find('a time').attr('data-time'));
    const articlefulltext = $(el).find('div[class="bbWrapper"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const postnumber = $(el).find('ul[class="message-attribution-opposite message-attribution-opposite--list"] li:last-child a').text().trim();
    posts.push(
      new Post(
        articlefulltext,
        {
          current_url: finalRedirectedUrl,
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
      selector: ['div[class="node-extra"]'],
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
