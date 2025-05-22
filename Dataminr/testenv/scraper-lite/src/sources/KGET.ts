import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.kget.com/news/local-news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const articlePublishedDate = $el.find('time').attr('datetime');
    if (moment(articlePublishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $el.find('h2 a,h3 a').attr('href');
      const headline = $el.find('h2 a, h3 a').text().trim();
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
  const titleQuery = '.article-info .article-title';
  const dateQuery = '.article-info p:contains(Posted:) time';
  const articleFullTextQuery = '.article-body';
  const dateText = fetchText(dateQuery, $, elements).split('/')[0];
  const date = moment(dateText, 'MMM DD, YYYY').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    ingestpurpose: 'mdsbackup',
    date,
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

export const parser = new LiteParser('KGET', baseURL, [
  {
    selector: ['#standard-layout article.article-list__article, #primary article.article-list__article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
