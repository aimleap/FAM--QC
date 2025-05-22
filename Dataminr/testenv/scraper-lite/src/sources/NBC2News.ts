import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://nbc-2.com/category/news/crime/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const link = $(el).find('.jeg_post_title a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('.jeg_post_title a').attr('href');
      const headline = $(el).find('.jeg_post_excerpt').text();
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
  const titleQuery = 'h1.amp-wp-title, h1.jeg_post_title';
  const articleFullTextQuery = '.amp-wp-article-content p, .content-inner p:not(:has(strong))';
  const title = fetchText(titleQuery, $, elements);
  const todaysDate = moment().format('MM/DD/YYYY');
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(todaysDate, 'MM/DD/YYYY').unix();
  const articleInfo = `florida: ${title}`;
  const extraDataInfo = {
    title: `florida: ${title}`,
    articleFullText,
    date: todaysDate,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser('NBC2 News', baseURL, [
  {
    selector: ['article.jeg_post'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
