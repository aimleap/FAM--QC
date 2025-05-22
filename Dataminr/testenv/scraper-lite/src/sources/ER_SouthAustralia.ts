import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const articlePublishedDate = $el.find('span.published').text().trim();
    if (moment(articlePublishedDate, 'LL').isSame(moment(), 'day')) {
      threads.push({
        link: $el.find('h2.entry-title>a').attr('href').trim(),
        title: `${moment(articlePublishedDate, 'LL').format('MM/DD/YYYY')}~${$el.find('h2.entry-title').text().trim()}`,
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

  if (url === 'https://xrsa.com.au/blog/') {
    return posts;
  }
  const titleSelector = 'h1.entry-title';
  const bodySelector = '.entry-content';
  const imageSelector = '.article img~src';
  const location = 'South Australia';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrsa.com.au', location);
}

export const parser = new LiteParser('Extinction Rebellion South Australia', 'https://xrsa.com.au/blog/', [
  {
    selector: ['#content-area #left-area article'],
    parser: threadHandler,
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
]);
