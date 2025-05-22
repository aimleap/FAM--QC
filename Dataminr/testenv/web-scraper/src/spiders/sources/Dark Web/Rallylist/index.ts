import moment from 'moment';
import { parseTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
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
  description: 'Malicious forum',
  isCloudFlare: true,
  name: 'Rallylist',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.rallylist.com/',
};

async function mainThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray($, elements, 'a', 'a', (): number => moment.utc().unix()).map((t) => ({
    ...t,
    parserName: 'thread',
  }));
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray($, elements, 'h2.entry-title a', 'h2.entry-title a', (): number => moment.utc().unix()).map((t) => ({
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
      const timestamp = moment.utc().unix();
      const message = $el.find('h1.loop-title.entry-title').text();

      const messageObj = {
        text: message,
        timestamp: '',
        userName: '',
        userUrl: '',
        currentUrl: url,
        isComment: '0',
      };

      const commentsObj = getForumComments(
        $,
        $el,
        'div.wpd-comment-right',
        'div.wpd-comment-text',
        'div.wpd-comment-date',
        'title',
        'div.wpd-comment-author',
        'wpd-comment-author',
      );

      commentsObj.push(messageObj);

      commentsObj.forEach((element) => {
        if (element.text === undefined) return;
        // time format is February 3, 2021 2:10 am
        const timeFormatted = element.timestamp === '' ? timestamp : parseTimestamp(element.timestamp);
        posts.push(
          new Post(
            element.text,
            {
              current_url: url,
              author_name: element.userName,
            },
            timeFormatted,
            forumPaths,
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
      name: 'main-thread',
      selector: ['li[id^="menu-item-30"], li[id^="menu-item-97434"]'],
      handler: mainThreadHandler,
    },
    {
      name: 'thread',
      selector: ['div.entry-grid-content'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[id^="content"]'],
      handler: postHandler,
    },
  ],
  50,
);
