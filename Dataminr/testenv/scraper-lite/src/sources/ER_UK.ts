import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment(
      $el.find('p.tease-post__meta').text().trim().split(' by ')[0],
      'MMMM D, YYYY',
    );
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('div > div > h2 > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~${$el
        .find('p.tease-post__preview')
        .text()
        .trim()}`,
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
  const titleSelector = 'div.post_header > h1';
  const bodySelector = 'div.two-col-layout__right';
  const imageSelector = 'div.two-col-layout__right img~data-src';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  const location = 'UK';
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://extinctionrebellion.uk/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_UK',
  'https://extinctionrebellion.uk/',
  [
    {
      selector: ['article'],
      parser: threadHandler,
    },
    {
      selector: ['article.post-type-post'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/',
);
