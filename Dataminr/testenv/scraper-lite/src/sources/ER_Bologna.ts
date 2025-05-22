import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://extinctionrebellion.it';
const baseUrlSuffix = '/php/posts-search.php?cat=Press&forceTitle=Comunicati%20Stampa';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const jsonObject = JSON.parse(response.body);
  const jsonArray = jsonObject.matches;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.date, 'YYYY-MM-DD').format('MM/DD/YYYY');
    if (moment(articlePublishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = jObj.url;
      const headline = jObj.title;
      threads.push({
        link: `${baseUrlPrefix}${href}`,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleSelector = 'h2.big-title';
  const bodySelector = '.container-fluid>.row>.col-sm-9 p:not(:has(a))';
  const imageSelector = '.container-fluid>.row>.col-sm-9 img~src';
  const location = 'Bologna';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://extinctionrebellion.it', location);
}

export const parser = new LiteParser('Extinction Rebellion Bologna', baseUrlPrefix, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
