import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { getThreadArray } from '../lib/parserUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  return getThreadArray($, elements, url, 'span.labelPreview', 'a.linkPost').map((t) => ({
    ...t,
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((el) => {
    try {
      const $el = $(el);
      const message = $el.find('.divMessage').text().trim();
      const rawTime = $el.find('span.labelCreated').text();
      const postUrl = url.split('#')[0] + $el.find('.linkSelf').attr('href');

      const time = moment.utc(rawTime, 'YYYY-MM-DD hh:mm:ss').unix();
      posts.push(
        new Post({
          text: message,
          postUrl,
          postedAt: time,
          extraData: {
            text: message,
            postUrl,
            postedAt: time,
          },
        }),
      );

      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  return posts;
}

export const parser = new LiteParser(
  'Kohlchan',
  'https://kohlchan.net/',
  [
    {
      selector: ['.latestPostCell'],
      parser: threadHandler,
    },
    {
      selector: ['.innerPost, .innerOP'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/index.html',
);
