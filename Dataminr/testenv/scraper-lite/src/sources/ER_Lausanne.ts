import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://xrlausanne.ch';
const baseUrlSuffix = '/category/newsletter-actualite/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((element) => {
    const $el = $(element);
    const articlePublishedDate = $el.find('h2.entry-title').text().split('|')[0].trim();
    if (moment(articlePublishedDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      threads.push({
        link: $el.find('h2.entry-title>a').attr('href').trim(),
        title: `${moment(articlePublishedDate, 'DD.MM.YYYY').format('MM/DD/YYYY')}~${$el.find('h2.entry-title>a').text().trim()}`,
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
  const titleSelector = 'h1.entry-title';
  const bodySelector = '.entry-content';
  const imageSelector = '.entry-content img~src';
  const location = 'Lausanne';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrlausanne.ch', location);
}

export const parser = new LiteParser('Extinction Rebellion Lausanne', baseUrlPrefix, [
  {
    selector: ['.main article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
