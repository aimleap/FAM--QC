import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment($el.find('> time').text().trim(), 'DD/MM/YYYY');
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('> a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~${$el.find('> div').text().trim()}`,
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
  const titleSelector = 'header > h1';
  const bodySelector = 'div.entry-content p';
  const imageSelector = 'img~src';
  const location = 'Amsterdam';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://extinctionrebellion.nl/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_Amsterdam',
  'https://extinctionrebellion.nl/',
  [
    {
      selector: ['div.entry-content li'],
      parser: threadHandler,
    },
    {
      selector: ['article.type-post'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/en/press-and-news/',
);
