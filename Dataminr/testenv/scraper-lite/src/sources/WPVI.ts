import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://api.abcotvs.com/v3/wpvi/list?key=otv.web.wpvi.collection&limit=100&from=0';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonArray = JSON.parse(response.body).data.items;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment.unix(jObj.date).format('MM/DD/YYYY hh:mm');
    if (moment(articlePublishedDate, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) {
      const href = jObj.link.url;
      const title = jObj.description;
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
  const titleQuery = 'h1';
  const dateQuery = '.Zdbe.aiPa';
  const articleFullTextQuery = 'article p:not(:has(b))';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  if (!moment(date, 'dddd, MMM DD, YYYY hh:mm a').isSame(moment(), 'day')) return posts;
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const description = data[0];
  const timestamp = moment(date, 'dddd, MMM DD, YYYY hh:mm a').unix();
  const articleInfo = `${title}; ${description}`;
  const extraDataInfo = {
    title,
    description,
    articleFullText,
    date,
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

export const parser = new LiteParser('WPVI', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['.FITT_Article_main'],
    parser: postHandler,
    name: 'post',
  },
]);
