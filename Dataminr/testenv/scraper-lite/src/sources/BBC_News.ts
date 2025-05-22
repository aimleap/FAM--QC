import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.bbc.com';
const baseURLSuffix = '/news/england/london';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const title = $el.find('h3.lx-stream-post__header-title').text();
    const href = $el.find('h3.lx-stream-post__header-title a').attr('href');
    threads.push({
      link: href,
      title,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const $el = $(elements);
  const headlineQuery = '#main-content #main-heading';
  const textQuery = '#main-content .ssrcss-1q0x1qg-Paragraph';

  const title = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = $el.find('#main-content time').attr('datetime').split('T')[0];

  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    discussion_title: title,
  };

  if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: textInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'BBC News',
  baseURLPrefix,
  [
    {
      selector: ['.lx-stream__feed.qa-stream article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
