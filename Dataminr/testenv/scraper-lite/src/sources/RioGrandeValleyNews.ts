import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.valleycentral.com/news/local-news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('time').attr('datetime').split('T')[0];
    if (moment(articlePublishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.article-list__article-title a.article-list__article-link').attr('href');
      const headline = $(el).find('.article-list__article-title a.article-list__article-link').text().replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
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
  const titleQuery = '.article-title';
  const dateQuery = '.article-info .article-meta p:contains(Posted:) time';
  const articleFullTextQuery = '.article-body';
  const title = fetchText(titleQuery, $, elements);
  const date = $(elements).find(dateQuery).attr('datetime').split('T')[0].trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
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

export const parser = new LiteParser('Rio Grande Valley News', baseURL, [
  {
    selector: ['#standard-layout article.article-list__article, .site-main>section.article-list article.article-list__article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
