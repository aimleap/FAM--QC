import moment from 'moment';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';
import { extractPosts, Selectors } from '../lib/sourceUtil';
import { Post, Thread } from '../lib/types';

const baseUrlPrefix = 'https://www.xrcambridge.org/';
const baseUrlSuffix = 'news';
async function preThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const scriptTagText = $(elements).find('script').get()[0].children[0].data;
  const jsonArray = JSON.parse(scriptTagText);
  const { buildId } = jsonArray;
  const jsonUrl = `${baseUrlPrefix}_next/data/${buildId}/news.json`;
  preThreads.push({
    link: jsonUrl,
    parserName: 'thread',
  });
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return threads;
  }
  const jsonObject = JSON.parse(response.body);
  const jsonArray = jsonObject.pageProps.posts;
  jsonArray.forEach((jObj: any) => {
    const dateInfo = (jObj.first_publication_date).split('T')[0];
    const articlePublishedDate = moment(dateInfo).format('MM/DD/YYYY');
    if (moment(articlePublishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const id = jObj.uid;
      const headline = jObj.data.description[0].text;
      threads.push({
        link: `${baseUrlPrefix}${id}`,
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
  const titleSelector = 'h1';
  const bodySelector = 'section';
  const imageSelector = 'section .image-gallery .image-gallery-slides img~src';
  const location = 'Cambridge';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://www.xrcambridge.org/',
    location,
  );
}

export const parser = new LiteParser('Extinction Rebellion Cambridge', baseUrlPrefix, [
  {
    selector: ['body'],
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
], baseUrlSuffix);
