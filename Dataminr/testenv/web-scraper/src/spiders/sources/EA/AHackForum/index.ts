import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'AHack Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://forum.ahack.ru/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('p[class="topicdetails"]:nth-of-type(2) a:nth-of-type(2)').attr('href');
    if (link1) {
      const title = $(el).find('td[class="row1"]:nth-of-type(2) a').text().trim();
      const link = `http://forum.ahack.ru${$(el).find('p[class="topicdetails"]:nth-of-type(2) a:nth-of-type(2)').attr('href').replace('./', '/')}`;
      const timestamp = moment().unix();
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
): Promise<Post[]> {
  const posts: Post[] = [];
  const id = url.split('#')[1];
  const title = $(elements).find('a[class="titles"]').text().trim();
  const forum = $(elements).find('p[class="breadcrumbs"]:first a:nth-of-type(2)').text().trim();
  const subforum = $(elements).find('p[class="breadcrumbs"]:first a:nth-of-type(3)').text().trim();
  const entrySelector = $(elements).find(`a[name="${id}"]`).closest('table.tablebg').get();
  entrySelector.forEach((el) => {
    const username = $(el).find('b[class="postauthor"]').text().trim();
    const articlefulltext = $(el).find('div[class="postbody"]').contents().text()
      .replace(/(https?|http):\/\/[^\s]+/g, '')
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const timestamp = moment().unix();
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
      selector: ['table[class="tablebg"]:nth-of-type(2) tr'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="wrapcentre"]'],
      handler: postHandler,
    },
  ],
  1440,
);
