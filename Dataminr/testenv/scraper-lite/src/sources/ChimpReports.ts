import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://chimpreports.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text();
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
  const discussionTitleQuery = '.entry-header .post-title';
  const dateQuery = '.entry-header .post-meta .date';
  const articleTextQuery = '.entry-content p';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();// parseTimestamp(date);
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: `${date}`,
  };

  if (moment(dateText, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
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

export const parser = new LiteParser('Chimp Reports', baseURL, [
  {
    selector: ['.post-title a'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
