import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType, ThreadType, SourceTypeEnum, appendLink,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

import { boards } from './boards';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: '8Kun',
  type: SourceTypeEnum.FORUM,
  url: 'https://8kun.top',
  expireIn: 600,
};

export function getNextPage(url: string): ThreadType | null {
  const match = url.match(/\d+.html$/);
  let page = 1;

  if (Array.isArray(match) && match.length > 0) {
    page = parseInt(match[0], 10);
  }

  if (page >= 25) return null;

  return {
    // @ts-ignore
    title: '',
    link: `${url.replace(/\d+.html$/, '')}${page + 1}.html`,
    timestamp: moment().unix(),
    parserName: 'post',
  };
}

async function threadHandler(): Promise<ThreadType[]> {
  const now = moment().unix();
  return boards.map((t) => ({
    title: t,
    link: t,
    timestamp: now,
    parserName: 'post',
    delay: (Math.floor(Math.random() * 7) + 1) * 1000, // Delay from 1 to 7 min
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<Post[] | ThreadType[]> {
  const posts = [];

  elements.forEach((thread) => {
    const $posts = $(thread).find('.post').get();
    $posts.forEach((p, i) => {
      const $post = $(p);
      const postedAt = parseInt($post.find('label time').attr('unixtime') || '0', 10);
      const postUrl = appendLink(
        source,
        $post.find('.intro a[id^="post_no_"]').attr('href') || url,
      );
      const message = $post.find('.body').text().trim().replace(/>>\d+/g, '');
      const username = $post.find('.name').text().trim() || '';
      if (postedAt >= backFilledTimestamp) {
        posts.push(
          new Post(
            message,
            {
              current_url: postUrl,
              author_name: username,
            },
            postedAt,
            [],
            [],
            new Map([['post_num', (i + 1).toString()]]),
          ),
        );
      }
    });
  });

  /* Crawl next page */
  if (posts.length > 0) {
    const thread = getNextPage(url);
    // @ts-ignore
    if (thread !== null) posts.push(thread);
  }

  // @ts-ignore
  return posts;
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
  30,
);
