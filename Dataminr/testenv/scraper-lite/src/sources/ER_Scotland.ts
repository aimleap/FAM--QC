import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment($el.find('p.tease-post__date a').text().trim(), 'MMMM D, YYYY');
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('p.tease-post__date a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~${$el.find('> p').text().trim()}`,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const titleSelector = 'h1.post__title';
  const bodySelector = 'div.type';
  const location = 'Scotland';
  const selectorList: Selectors = { titleSelector, bodySelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://www.xrebellion.nyc/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_Scotland',
  'https://xrscotland.org/',
  [
    {
      selector: ['article.tease-post'],
      parser: threadHandler,
    },
    {
      selector: ['div.post__content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news',
);
