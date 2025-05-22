import { parseRelativeTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacker/Hacking Group',
  isCloudFlare: true,
  name: 'Anonymous Hackers',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.anonymoushackers.net/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find(' div[class="date created-date"] a ')
      .attr('title');
    const link = $(el).find('div[class="date created-date"] a').attr('href');
    const time = $(el).find('div[class="date created-date"] a ').text().trim();
    const timestamp = parseRelativeTimestamp(time);
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
  const title = $(elements).find('h1').text();
  const articletext = $(elements)
    .find('div[class*="entry-content"]')
    .contents()
    .text()
    .trim();
  const comments = $(elements).find('div[class="comments"] a').text().trim();
  const views = $(elements)
    .find('span[class="post-views-count"]')
    .text()
    .trim();
  const time = $(elements).find('div[class="date created-date"]').text().trim();
  const timestamp = parseRelativeTimestamp(time);
  const text = `${articletext}\n${title}`;
  posts.push(
    new Post(
      text,
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
          views,
          comments,
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
      selector: ['div.row.gutter-parent-14 div.col-sm-6'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
