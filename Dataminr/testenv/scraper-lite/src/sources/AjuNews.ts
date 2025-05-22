import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.ajunews.com/politics/northkorea';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURL}?page=${index}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('ul.date').text().replace(/\n+/g, '')
      .replace(/\t+/g, ' ')
      .trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD hh:mm:ss').isSame(moment(), 'day')) {
      const href = `https:${$(el).find('a.tit').attr('href')}`;
      const headline = $(el).find('a.tit').text();
      threads.push({
        link: href,
        title: `${articlePublishedDate}~${headline}`,
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
  if (url === baseURL) return [];
  const titleQuery = 'article.view_header h1';
  const dateQuery = 'article.view_header dd.date span';
  const articleTextQuery = 'article.view_content.content_wrap .article_wrap div[style^="text-align"]';
  $(elements).find('.relate_box').remove();
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY-MM-DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
    Date: date,
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

export const parser = new LiteParser('Aju News', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.list_content section ul.news_list li.news_item'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['#container'],
    parser: postHandler,
    name: 'post',
  },
]);
