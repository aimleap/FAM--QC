import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://en.sun.mv/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const title = $el.find('a:not(.article-tag)').text();
    const href = $el.find('a:not(.article-tag)').attr('href');
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

  if (url === baseURL) {
    return posts;
  }

  const $el = $(elements);
  const headlineQuery = '.article-reader-details h1';
  const textQuery = '.row .reader-body-content';

  const title = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = `${$el.find('.datetime').text().split(' ')[0]} ${$el.find('.datetime').text().split(' ')[1]} ${$el.find('.datetime').text().split(' ')[2]}`;

  const timestamp = moment(date, 'LL').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    discussion_title: title,
  };

  if (moment(date, 'LL').isSame(moment(), 'day')) {
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

export const parser = new LiteParser('SunOnline International', baseURL, [
  {
    selector: ['.widget-article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
