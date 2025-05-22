import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.htsstlucia.org';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('h2.post-box-title a').attr('href');
    const headline = $el.find('h2.post-box-title').text();
    threads.push({
      link: href,
      title: headline,
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
  const dateText = $el.find('article .tie-date').text();
  if (moment(dateText, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
    const titleQuery = 'article h1.entry-title';
    const textQuery = 'article .entry';

    const discussionTitle = fetchText(titleQuery, $, elements);
    const articleText = fetchText(textQuery, $, elements);
    const timestamp = moment(dateText, 'MMMM DD, YYYY').unix();
    const newsInfo = `${articleText}`;
    const extraDataInfo = {
      discussion_title: discussionTitle,
      Date: `${dateText}`,
    };

    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('HTS St. Lucia', baseURL, [
  {
    selector: ['.cat-box-content article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
