import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://cbs4local.com/api/rest/audience/more?section=cbs4local.com/news/local&limit=50';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const yesterday = moment().subtract(1, 'day');
  const jsonObj = JSON.parse(response.body);
  const jsonArray = jsonObj.data;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = jObj.publishedDate;
    if (moment(articlePublishedDate).isAfter(yesterday)) {
      const articleText = jObj.summary;
      const articleUrl = `https://cbs4local.com${jObj.url}`;
      threads.push({
        link: articleUrl,
        title: articleText,
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
  const titleQuery = 'h1';
  const dateQuery = '.index-module_storyDatelineText__wPM6';
  const articleFullTextQuery = '.index-module_storyColumn__EZ7G p:not(:has(a))';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  if (!moment(date, 'ddd, MMMM Do YYYY').isSame(moment(), 'day')) return posts;
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'ddd, MMMM Do YYYY').unix();
  const articleInfo = `${title} ; ${description}`;
  const extraDataInfo = {
    title,
    description,
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

export const parser = new LiteParser('CBS4Local', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
