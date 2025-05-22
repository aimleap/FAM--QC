import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { Selectors, extractPosts } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('h3.entry-title>a').attr('href');
    if (typeof link !== 'undefined' && link.includes(todaysDate)) {
      const href = $el.find('h3.entry-title>a').attr('href');
      const headline = $el.find('.entry-content>p').text().replace(/\n+/g, '').trim();
      threads.push({
        link: href,
        title: `${moment(todaysDate, 'YYYY/MM/DD').format('MM/DD/YYYY')}~${headline}`,
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

  if (url === 'https://xrpeace.org/') {
    return posts;
  }
  const titleSelector = 'h1.entry-title';
  const bodySelector = '.entry-content';
  const imageSelector = '.wp-block-image img~src';
  const location = '';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrpeace.org/', location);
}

export const parser = new LiteParser('Extinction Rebellion Peace', 'https://xrpeace.org/', [
  {
    selector: ['#main article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
