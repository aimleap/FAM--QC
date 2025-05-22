import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  getThreadArray,
  SourceType,
  SourceTypeEnum,
  ThreadType,
  getForumComments,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Malicious Forum',
  isCloudFlare: false,
  name: 'Ancaps',
  type: SourceTypeEnum.FORUM,
  url: 'https://ancaps.win',
  entryUrl: '/new',
};

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp).unix();

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray(
    $,
    elements,
    'div.top a.title',
    'div.top a.title',
    ($html: CheerioSelector, element: CheerioElement): number => toUnixTimestamp($html(element).find('span.mobile time').attr('datetime')),
  ).map((t) => ({
    ...t,
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    try {
      const $el = $(el);
      const message = $el.find('div.top a').text();
      const rawTime = $el.find('div.details span.mobile time').attr('datetime');
      const username = $el.find('div.details span.mobile a.author').text().trim();
      const userurl = $el.find('div.details span.mobile a.author').attr('href').trim();

      const messageObj = {
        text: message,
        timestamp: rawTime,
        userName: username,
        userUrl: userurl,
        currentUrl: url,
        isComment: '0',
      };

      const commentsObj = getForumComments(
        $,
        $el,
        'div.body',
        'div.content p',
        'span.since time.timeago',
        'datetime',
        'a.author',
        'a.author',
      );

      commentsObj.push(messageObj);

      commentsObj.forEach((data) => {
        if (data.text === undefined || data.timestamp === undefined) return;

        const text = data.text.trim();
        const time = toUnixTimestamp(data.timestamp);
        const userName = data.userName.trim().replace('\\\\n', '');
        posts.push(
          new Post(
            text,
            {
              current_url: url,
              author_name: userName,
            },
            time,
            [],
            [],
            new Map(
              Object.entries({
                post_num: data.isComment,
                user_url: `${source.url}${data.userUrl}`,
              }),
            ),
          ),
        );
      });

      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div.body'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['article.main-content'],
      handler: postHandler,
    },
  ],
  40,
);
