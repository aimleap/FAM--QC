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
        .find('section > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `~${$el.find('section > a > footer > p').text().trim()}`,
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
  const titleSelector = '#main > div > h1';
  const bodySelector = 'article';
  const imageSelector = 'article img~src';
  const location = 'Germany';
  elements.forEach((ele) => {
    const $el = $(ele);
    const date = moment(
      $el.find('p.blog-entry__from em:eq(1)').text().trim(),
      'DD.MM.YYYY',
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
  'ER_Germany',
  'https://extinctionrebellion.de/',
  [
    {
      selector: [
        '#main > section.block.grid-block.bg--xr-transparent.align-full_page.color--xr-black.clearfix > div > div > div > div',
      ],
      parser: threadHandler,
    },
    {
      selector: ['body.blogentrypage-page #main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news',
);
