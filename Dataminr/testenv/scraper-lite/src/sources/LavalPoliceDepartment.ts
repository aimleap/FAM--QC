import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.laval.ca';
const baseURLSuffix = '/police/Pages/Fr/communiques-de-presse.aspx';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const scriptTagText = $(elements).find('script:contains(Laval.NewsArchive.initialize)').get()[0].children[0].data;
  const formattedScriptTagText = scriptTagText.split('Laval.NewsArchive.initialize(')[1];
  const finalScript = `${formattedScriptTagText.split('}],')[0]}}]`;
  const jsonArray = JSON.parse(finalScript);
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = jObj.ArticleDate.split('(')[1].split(')')[0];
    const date = moment.unix(articlePublishedDate / 1000).format('MM/DD/YYYY hh:mm');
    if (moment(date, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) {
      const href = jObj.PageUrl;
      threads.push({
        link: href,
        title: date,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1.page-title';
  const articleFullTextQuery = '.page-content .ms-rtestate-field';
  const title = fetchText(titleQuery, $, elements);
  const date = data[0];
  const location = 'Laval, Quebec, Canada';
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm').unix();
  const articleInfo = `${title} ; ${date} ; ${location} ; ${articleFullText}`;
  const extraDataInfo = {
    title,
    date,
    location,
    articleFullText,
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

export const parser = new LiteParser('Laval Police Department', baseURLPrefix, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
