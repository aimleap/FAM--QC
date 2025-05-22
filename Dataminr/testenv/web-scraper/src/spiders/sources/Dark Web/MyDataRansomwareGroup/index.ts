import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'MyData Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://mydatae2d63il5oaxxangwnid5loq2qmtsol2ozr6vtb7yfm5ypzo6id.onion/blog',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="a_title"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const link = `http://mydatae2d63il5oaxxangwnid5loq2qmtsol2ozr6vtb7yfm5ypzo6id.onion/${$(el).find('a[class="a_title"]').attr('href')}`;
    const timestamp = moment().unix();
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
  const title = $(elements).find('div[class="news_title"] div').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const articletext = $(elements).find('div[style*="line-height"]').contents().text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${articletext}\n${title}`,
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
          articletext,
          ingestpurpose: 'darkweb',
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
      selector: ['div[class="b_block"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="b_block"]'],
      handler: postHandler,
    },
  ],
  1440,
);
