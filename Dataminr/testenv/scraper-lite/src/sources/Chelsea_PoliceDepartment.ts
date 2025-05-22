import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const APIURL = 'https://chelseapolice.com/_assets_/newslist.json';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonArray = JSON.parse(response.body);
  jsonArray.forEach((jObj: any) => {
    const articlePublicationDate = moment(jObj.date, 'MMM DD').format('MM/DD/YYYY');
    if (moment(articlePublicationDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = `https://chelseapolice.com/${jObj.link}`;
      threads.push({
        link: href,
        title: articlePublicationDate,
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
  if (url === APIURL) return posts;
  const $el = $(elements);
  const titleQuery = 'h1#page-title';
  const articleFullTextQuery = 'article div:not(#breadcrumbs, #post)';
  const title = fetchText(titleQuery, $, elements);
  const date = data[0];
  $el.find('h1#page-title').remove();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${articleFullText}`;
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

export const parser = new LiteParser('Chelsea Police Department', APIURL, [
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
