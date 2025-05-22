import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';
import { extractPosts, Selectors } from '../lib/sourceUtil';
import { Post, Thread } from '../lib/types';

const baseUrlPrefix = 'https://extinctionrebellionsfbay.org';
const baseUrlSuffix = '/events/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const href = $el.find('h3>a').attr('href').trim();
    const title = $el.find('h3>a').text().trim();
    const h3Tag = $el.find('h3');
    h3Tag.find('a').remove();
    const articlePublishedDate = h3Tag.text().trim();
    if (moment(articlePublishedDate, 'LL').isSame(moment(), 'day')) {
      threads.push({
        link: href,
        title: `${moment(articlePublishedDate, 'LL').format('MM/DD/YYYY')}~${title}`,
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
  const titleSelector = 'h1.post-title';
  const bodySelector = '.post-content';
  const imageSelector = '.post-content img~src';
  const location = 'San Francisco Bay Area';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://extinctionrebellionsfbay.org', location);
}

export const parser = new LiteParser('Extinction Rebellion San Francisco Bay Area', baseUrlPrefix, [
  {
    selector: ['article section div.block, article section div#fb-event'],
    parser: threadHandler,
  },
  {
    selector: ['.page-content'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
