import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.fox21news.com/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('footer.article-list__article-meta time').attr('datetime').split('T')[0].trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.article-list__article-title a').attr('href');
      const headline = $(el).find('.article-list__article-title a').text().replace(/\n+/g, ' ')
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
  const titleQuery = 'h1.article-title';
  const dateQuery = '.article-info p:contains(Posted:) time';
  const articleFullTextQuery = '.article-content';
  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split('/')[0].trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMM DD, YYYY').unix();
  const articleInfo = `colorado: ${title}`;
  const extraDataInfo = {
    title: `colorado: ${title}`,
    articleFullText,
    date: dateText,
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

export const parser = new LiteParser('Fox 21 Colorado', baseURL, [
  {
    selector: ['section article.article-list__article'],
    parser: threadHandler,
  },
  {
    selector: ['.site-content'],
    parser: postHandler,
    name: 'post',
  },
]);
