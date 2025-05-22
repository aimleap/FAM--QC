import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todayDate = moment().format('MM/DD/YYYY');
  elements.forEach((element) => {
    const $el = $(element);
    threads.push({
      link: $el
        .find('> div > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${todayDate}~${$el.find('> div > a > div.card__content p').text().trim()}`,
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
  const titleSelector = '> div > div > div:nth-child(1) > div > h1';
  const bodySelector = '> div > div > div.col-12.col-md-9.mb-5.text-content > p';
  const imageSelector = '> div > div > div.col-12.col-md-9.mb-5.text-content img~src';
  const location = 'Derby';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://rebellionderby.earth/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_Derby',
  'https://rebellionderby.earth/',
  [
    {
      selector: ['div.news > div.mb-5'],
      parser: threadHandler,
    },
    {
      selector: ['div.content-area'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/',
);
