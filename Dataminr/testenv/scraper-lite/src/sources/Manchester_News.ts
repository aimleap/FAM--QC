import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { parseTimestamp } from '../lib/timestampUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://manchesternews.com/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const time = $(el).find('.post-details .date').text();
    if (time.includes('hours ago') || time.includes('mins ago') || time.includes('minutes ago') || time.includes('seconds ago')) {
      const href = $el.find('.post-details .post-title a').attr('href');
      const headline = $el.find('.post-details .post-title').text();
      threads.push({
        link: href,
        title: headline,
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
  if (url === baseURL) {
    return posts;
  }
  const titleQuery = '.site .main-content .entry-header h1.post-title';
  const articleTextQuery = '.site .main-content .entry-content';
  const dateQuery = '.site .main-content .entry-header .date';

  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const timestamp = parseTimestamp(dateText);
  const newsInfo = `${articleText}`;
  const extraDataInfo = { discussion_title: title };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Manchester News', baseURL, [
  {
    selector: ['.site .container-normal .main-content #tie-block_1474 .mag-box-container ul li'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
