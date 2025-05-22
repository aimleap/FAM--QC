import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://fcpdnews.wordpress.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.meta-date time').text();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.post-title a').attr('href');
      const title = $(el).find('.post-title a').text();
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
  const titleQuery = 'h2.post-title';
  const dateQuery = '.meta-date time';
  const articleFullTextQuery = '.entry';
  $(elements).find('#jp-post-flair').remove();
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${articleFullText}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
    Text: articleFullText,
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

export const parser = new LiteParser('Fairfax County Police Department', baseURL, [
  {
    selector: ['.primary article'],
    parser: threadHandler,
  },
  {
    selector: ['.primary'],
    parser: postHandler,
    name: 'post',
  },
]);
