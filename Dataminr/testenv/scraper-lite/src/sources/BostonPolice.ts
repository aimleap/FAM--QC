import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://police.boston.gov/stories-in-the-news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.entry-meta .posted-on').text();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h2.entry-title a').attr('href');
      const title = `${articlePublishedDate}#${$(el).find('.entry-meta').text().trim()}`;
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const titleQuery = '.entry-title';
  const articleFullTextQuery = '.entry-content';
  const title = fetchText(titleQuery, $, elements);
  const infoWithDate = data[0].split('#')[1];
  const date = data[0].split('#')[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${infoWithDate} ; ${articleFullText}`;
  const extraDataInfo = {
    title,
    Date: infoWithDate,
    articleFullText,
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

export const parser = new LiteParser('Boston Police', baseURL, [
  {
    selector: ['#main article'],
    parser: threadHandler,
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
]);
