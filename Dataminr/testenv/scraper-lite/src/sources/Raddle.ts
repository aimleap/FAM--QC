import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    if ($el.find('div h1 a').attr('href').indexOf('https') === -1) {
      threads.push({
        link: `${$el.find('div h1 a').attr('href')}/linear`,
        title: $el.find('div h1 a').text(),
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url.indexOf('https://raddle.me/f/Illegalism/') === -1) {
    return posts;
  }
  const $el = $(elements[0]);
  const title = $el
    .find('.submission__inner .submission__title-row')
    .text()
    .trim()
    .replace(/\t+/g, '')
    .replace(/\n+/g, '');
  $el.find('.comment__main').each((index, data) => {
    const datePosted = $(data).find('header h1 span time').attr('datetime').split('T')[0];
    if (!moment().isSame(datePosted, 'day')) return;
    const comment = $(data)
      .find('.comment__body')
      .text()
      .trim()
      .replace(/\t+/g, '')
      .replace(/\n+/g, '');
    posts.push(
      new Post({
        text: `Submitted: ${datePosted} - Post Title: ${title} - Comment: ${comment}`,
        postUrl: url,
        postedAt: moment(datePosted, 'YYYY-MM-DD').unix(),
        extraData: {
          'Submitted Date': datePosted,
          Post_title: title,
          ingestType: 'INGEST_API',
          Comment: comment,
          receivedTimestamp: moment(datePosted, 'YYYY-MM-DD').unix(),
        },
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'Raddle',
  'https://raddle.me/',
  [
    {
      selector: ['.submission__header'],
      parser: threadHandler,
    },
    {
      selector: ['#main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/f/Illegalism',
);
