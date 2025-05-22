import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.lakewoodpolicenj.com/lwpd-blog/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.fusion-meta-info span:eq(4)').text();
    const title = $(el).find('h2.entry-title').text().trim();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day') && title === '#LPDBLOTTER') {
      const href = $(el).find('h2 a').attr('href');
      threads.push({
        link: href,
        title,
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
  if (url === baseURL) return posts;
  const titleQuery = '.entry-title';
  const dateQuery = '.fusion-meta-info span:eq(4)';
  const articleFullTextQuery = '.post-content';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${articleFullText}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
    Description: articleFullText,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Lakewood Police Department', baseURL, [
  {
    selector: ['#posts-container article'],
    parser: threadHandler,
  },
  {
    selector: ['#content article'],
    parser: postHandler,
    name: 'post',
  },
]);
