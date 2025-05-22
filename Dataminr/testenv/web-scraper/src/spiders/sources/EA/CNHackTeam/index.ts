import moment from 'moment';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'Hacking World',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.thehackerworld.com/files/Hacking-tools/1.html/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[title*="View the file"]').text().trim();
    const link = $(el).find('a[title*="View the file"]').attr('href');
    const time = $(el).find('time').attr('datetime');
    const timestamp = moment(time).unix();
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
  const title = $(elements).find('h1 span').text().trim();
  const tags = $(elements).find('ul[class*="ipsTags"] li span').text().trim();
  const articlefulltext = $(elements)
    .find('h2 + div[class*="ipsType_richText"] p')
    .text()
    .trim();
  const date = $(elements).find('time').attr('datetime');
  const timestamp = moment(date).unix();
  posts.push(
    new Post(
      articlefulltext,
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
          articlefulltext,
          tags,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['li[class="ipsDataItem   "]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="ipsLayout_mainArea"]'],
      handler: postHandler,
    },
  ],
  1440,
);
