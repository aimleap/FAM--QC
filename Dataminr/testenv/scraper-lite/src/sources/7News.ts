import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://content.7news.com.au/v4/publication?excludeRegional=false&excludeSubTopics=false&page=1&page_offset=0&page_size=100&profiles=true&random=false&topics=news%2Fnsw';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonArray = JSON.parse(response.body).documents;
  jsonArray.forEach((jObj: any) => {
    const articlePublicationDate = moment(jObj.publicationDate.split('T')[0]).format('MM/DD/YYYY');
    if (moment(articlePublicationDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      /* eslint no-underscore-dangle: 0 */
      const href = jObj._self;
      const title = jObj.heading;
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
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const titleQuery = 'h1';
  const dateQuery = '.css-1b6wfhz-StyledArticleByline time';
  const articleFullTextQuery = '#ArticleContent';
  const title = fetchText(titleQuery, $, elements);
  const date = $(elements).find(dateQuery).attr('datetime').split('T')[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
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

export const parser = new LiteParser('7NEWS', baseURL, [
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
