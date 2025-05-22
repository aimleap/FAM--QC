import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: false,
  name: 'Antimigalki Forums',
  type: SourceTypeEnum.FORUM,
  url: 'http://antimigalki.guru/',

};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const tagged = $(el).find('i[class="fa fa-thumb-tack icon"]');
    if (tagged.length === 0) {
      const link = `http://antimigalki.guru${$(el).find('span[class="title"] a').attr('href')}`;
      const title = $(el).find('span[class="title"] a').text().trim();
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
  response:any,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1].trim();
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const forum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-of-type(2) span[itemprop="name"]').text().trim();
  const subforum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-of-type(3) span[itemprop="name"]').text().trim();
  const entrySelector = $(elements).find(`article[data-content="${id}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('div[class="message-userDetails"] a[itemprop="name"]').text().trim();
    const date = $(el).find('time').attr('title');
    const timestamp = Number($(el).find('time').attr('data-time'));
    const articlefulltext = $(el).find('div[class*="message-content"]').text().replace(/[\t\n\s]+/g, ' ')
      .trim();
    const text = $(el).find('div[class*="message-content"]').text().replace(/(https?|http):\/\/[^\s]+/g, '')
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const postnumber = $(el).find('ul[class*="message-attribution"] li:nth-of-type(2) a').text().trim();
    posts.push(
      new Post(
        `${text}\n${title}`,
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
            username,
            postnumber,
            posteddate: date,
            articlefulltext,
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
      selector: ['ul[class="content"] li'],
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
