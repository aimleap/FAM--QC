import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Noteshubs Blog',
  type: SourceTypeEnum.FORUM,
  url: 'http://2m4oukcxckmsvhbf4kkjc4ehdrhk5csn3bk54jb3ufqrmlyxtt3c4wqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text();
    const link = `http://2m4oukcxckmsvhbf4kkjc4ehdrhk5csn3bk54jb3ufqrmlyxtt3c4wqd.onion${$(el).find('a[class="entry-link"]').attr('href')}`;
    const date = $(el).find('time').text().trim()
      .replace('at ', '');
    const timestamp = moment(date, 'MMMM DD YYYY hh:mm').unix();
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
  const title = $(elements).find('header h1').text().trim();
  const articlefulltext = $(elements).find('div[class="post-content"] p').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const date = $(elements).find('time').text().trim()
    .replace('at ', '');
  const timestamp = moment(date, 'MMMM DD YYYY hh:mm').unix();
  const text = `${articlefulltext}\n${title}`;
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
          articlefulltext,
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
      selector: ['div[class="posts"] article'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[class="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
