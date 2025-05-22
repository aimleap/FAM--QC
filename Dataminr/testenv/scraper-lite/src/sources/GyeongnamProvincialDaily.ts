import moment from 'moment';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { fetchText } from '../lib/sourceUtil';
import { Post, Thread } from '../lib/types';

const baseUrl = 'https://www.idomin.com/news/articleList.html?view_type=sm';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 6; index++) {
    preThreads.push({
      link: `https://www.idomin.com/news/ajaxArticlePaging.php?total=&list_per_page=20&page_per_page=10&page=${index}&view_type=sm`,
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseUrl) return threads;
  const jsonArray = JSON.parse(response.body).data;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.pub_date, 'YYYY-MM-DD').format('MM/DD/YYYY');
    if (moment(articlePublishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = `https://www.idomin.com/news/articleView.html?idxno=${jObj.idxno}`;
      threads.push({
        link: href,
        title: jObj.title,
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
  if (url === baseUrl) return posts;
  moment.locale('ko');
  const dateText = fetchText('.article-head-info .info-text.fixed ul li:eq(1)', $, elements).replace('입력', '').trim();
  const date = moment(dateText, ['YYYY-MM-DD hh:mm ddd', 'YYYY MM DD dddd']).format('MM/DD/YYYY');
  const title = fetchText('.article-head-title', $, elements);
  const articleText = fetchText('#article-view-content-div p', $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm ddd').unix();
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

export const parser = new LiteParser('Gyeongnam Provincial Daily', baseUrl, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['*'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
