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
        .find('> article > div > h1 > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `~${$el.find('article.tease-post p').text().trim()}`,
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
  const titleSelector = '> div.post__header > h1';
  const bodySelector = '> div.type > p';
  const imageSelector = '> div.type img~src';
  const location = 'Exeter';
  elements.forEach((ele) => {
    const $el = $(ele);
    const date = moment(
      $el.find('div.post__header > p').text().trim().split('-')[0],
      'dddd LLL',
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
    'https://extinctionrebellionexeter.org/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_Exeter',
  'https://extinctionrebellionexeter.org/',
  [
    {
      selector: ['#content > div > div > div > div > ul > li'],
      parser: threadHandler,
    },
    {
      selector: ['div.post__content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/category/stories/',
);
