import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://scenes.noblogs.org/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.entry-meta .posted-on time').text();
    if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.entry-title a').attr('href');
      const headline = $(el).find('.entry-title').text();
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
  if (url === baseURL) return posts;
  const titleQuery = 'h1.entry-title';
  const publishedDateQuery = '.entry-meta .posted-on time.entry-date.published';
  const articleTextQuery = '.entry-content';
  const publishedDate = fetchText(publishedDateQuery, $, elements).trim();
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(publishedDate, 'MMMM DD, YYYY').unix();
  const newsInfo = `${title}; ${articleText}`;
  const extraDataInfo = {
    Title: title, Text: articleText, Date: publishedDate,
  };
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

export const parser = new LiteParser('Scenes From The Atlanta Forest', baseURL, [
  {
    selector: ['article'],
    parser: threadHandler,
  },
  {
    selector: ['#main article'],
    parser: postHandler,
    name: 'post',
  },
]);
