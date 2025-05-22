import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    threads.push({
      link: $el
        .find('> div > div > h3 > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `~${$el.find('> div > div > div.card-excerpt > p').text().trim()}`,
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
  const titleSelector = '> header > h1';
  const bodySelector = '> div > p';
  const imageSelector = 'img~src';
  const location = 'Zurich';
  elements.forEach((ele) => {
    const $el = $(ele);
    if ($el.find('> header > div.action-date').text().trim() === '') return;
    const date = moment($el.find('> header > div.action-date').text().trim(), 'D MMMM YYYY').format(
      'MM/DD/YYYY',
    );
    /* eslint-disable no-param-reassign */
    data[0] = date + data[0];
  });
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://www.xrebellion.ch/', location);
}

export const parser = new LiteParser(
  'ER_Zurich',
  'https://www.xrebellion.ch/',
  [
    {
      selector: ['#blog > div > div > div'],
      parser: threadHandler,
    },
    {
      selector: ['#page-content > div > article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/',
);
