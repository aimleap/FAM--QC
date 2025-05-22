import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink, SourceType, SourceTypeEnum, ThreadType,
} from '../../../../lib/parserUtil';

import { boards } from './boards';
import { generateBoardLinks, getNextPageThread } from '../../../../lib/4ChanUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: '9Chan',
  type: SourceTypeEnum.FORUM,
  url: 'https://9chan.tw/',
  expireIn: 600,
};

export function getPost(element: Cheerio, postNumber: number): Post {
  element.find('.divMessage a').remove();
  const postedAt = moment(element.find('time').attr('datetime')).unix();
  const message = element.find('.post').text();
  const currentUrl = appendLink(source, element.find('.post-no').attr('href') || '');
  const authorName = element.find('.author').text().trim() || '';

  return new Post(
    message,
    {
      current_url: currentUrl,
      author_name: authorName,
    },
    postedAt,
    [],
    [],
    new Map([['post_num', postNumber.toString()]]),
  );
}

export async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<Post[] | ThreadType[]> {
  const posts = [];

  elements.forEach((thread) => {
    const result = [];
    const $thread = $(thread);
    const originalPost = $thread.find('article').first();
    const comments = $thread.find('.thread-dangling article');
    result.push(getPost(originalPost, 0));
    comments.each((i, comment) => result.push(getPost($(comment), i + 1)));
    result.filter((p) => p.posted_at >= backFilledTimestamp).forEach((p) => posts.push(p));
  });

  const nextPageThread = getNextPageThread(url);
  if (posts.length > 0 && nextPageThread !== null) posts.push(nextPageThread);

  // @ts-ignore
  return posts;
}

async function threadHandler(): Promise<ThreadType[]> {
  return generateBoardLinks(boards, 1, 5);
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['body'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.thread'],
      handler: postHandler,
    },
  ],
  35,
);
