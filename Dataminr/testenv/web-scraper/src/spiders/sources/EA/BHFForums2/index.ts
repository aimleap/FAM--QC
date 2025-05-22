import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'BHF Forums 2',
  type: SourceTypeEnum.FORUM,
  url: 'https://bhf.gg/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="node-extra-title"]').attr('title');
    const link = `https://bhf.gg${$(el)
      .find('a[class="node-extra-title"]')
      .attr('href')
      .replace('post', '#post')}`;
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
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const forums = $(elements)
    .find('ul[class="p-breadcrumbs "] li:nth-child(2) a span')
    .text()
    .trim();
  const subforums = $(elements)
    .find('ul[class="p-breadcrumbs "] li:nth-child(3) a span')
    .text()
    .trim();
  const views = $(elements).find('li[title="Views"]').text().split('\t');
  const views1 = views[views.length - 3].trim();
  const entrySelector = $(elements).find('div[class="message-inner"]').get();
  entrySelector.forEach((el) => {
    const username = $(el).find('div[class="message-userDetails"] h4').text().trim();
    const articletext = $(el)
      .find('div[class="bbWrapper"]')
      .contents()
      .text()
      .trim()
      .replace(/^\s+|\n+$/gm, '');
    const postNumber = $(el)
      .find(
        'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a',
      )
      .text()
      .trim();
    const timestamp = Number($(el).find('header time').attr('data-time'));
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
            title,
            forums,
            subforums,
            views: views1,
            postNumber,
            username,
            articlefulltext: articletext,
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
      selector: ['div[class="p-body-inner "]'],
      handler: postHandler,
    },
  ],
  1440,
);
