import moment from 'moment';
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
  isCloudFlare: true,
  name: 'Pitch',
  type: SourceTypeEnum.FORUM,
  url: 'http://pitchzzzoot5i4cpsblu2d5poifsyixo5r4litxkukstre5lrbjakxid.onion/',
  randomDelay: [180000, 240000],
  requestOption: {
    headers: {
      Cookie:
        'access=osqBgMdkVnJ5OhnbeXizSy%2BRWjprDqcNaA3NW9%2BY3Oyj; pitch=9uhpslloqh25prqk1uu6d4mlp1',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('tr span[class="topic"] a').attr('title');
    const link = `${source.url}${$(el)
      .find('div:nth-of-type(3) a[style]')
      .attr('href')}`;
    const time = $(el).find(' div:nth-of-type(1)[title]').attr('title');

    const timestamp = moment.utc(time, 'YYYY-MM-DD hh:mm:ss A').unix();
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
  const title = $(elements)
    .find('div[style="word-break:break-word;"]')
    .contents()
    .text()
    .trim();
  const entrySelector = $(elements)
    .find('div[style="margin:0 10px 0 10px;"]  div[id]:last-child')
    .get();
  entrySelector.forEach((el) => {
    const username = $(el).find('a[class]').contents().text()
      .trim();
    const timestamp = moment.utc($(el).find('div[title]').attr('title')).unix();
    const articletext = $(el)
      .find('div[style*="-break:break-word;"]')
      .contents()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r|\t)/gm, '');
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
            entity: title,
            title,
            articlefulltext: articletext,
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
      selector: ['div[id*="p"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
