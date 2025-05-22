import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Blog',
  isCloudFlare: false,
  name: 'Act For Free',
  type: SourceTypeEnum.FORUM,
  url: 'https://actforfree.noblogs.org/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h1[class="entry-title"] a').text();
    const time = $(el).find('time[class="entry-date"]').text().trim();
    const link = $(el).find('h1[class="entry-title"] a').attr('href');
    const timestamp = (moment.utc(time, 'DD MMM YYYY')).unix();
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
  const title = $(elements).find('h1[class="entry-title"]').text().trim();
  const Event = $(elements).find('span[class="cat-links"] a').text().trim();
  const time = $(elements).find('time[class="entry-date"]').text().trim();
  const articlefulltext = $(elements).find('div[class="entry-content"]').text();
  const timestamp = (moment.utc(time, 'DD MMM YYYY')).unix();
  posts.push(new Post(
    title,
    {
      current_url: url,
    },
    timestamp,
    [],
    [],
    new Map(
      Object.entries({
        title,
        Event,
        articlefulltext,
        ingestpurpose: 'deepweb',
        parser_type: PARSER_TYPE.AIMLEAP_PARSER,
      }),
    ),
  ));
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['header[class="entry-header"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
