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
        .find('div > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `~${$el.find('> div > div > div').text().trim()}`,
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
  const titleSelector = 'h1.entry-title';
  const bodySelector = 'figure.wp-block-table td';
  const imageSelector = 'img~src';
  const location = 'Portland';
  elements.forEach((ele) => {
    const $el = $(ele);
    const date = moment(
      $el.find('> div > header > div > span.posted-on > time.published').text().trim(),
      'MMMM D, YYYY',
    ).format('MM/DD/YYYY');
    /* eslint-disable no-param-reassign */
    data[0] = date + data[0];
  });
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://extinctionrebellion.de/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_Portland',
  'https://xrpdx.org/',
  [
    {
      selector: ['#pt-cv-view-f8720bd8hr > div > div'],
      parser: threadHandler,
    },
    {
      selector: ['article.type-post'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/blog/',
);
