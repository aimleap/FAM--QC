import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const dateElement = $el.find('> div > div > div.blog-byline').text().trim();
    const postedDate = moment(
      dateElement.substring(dateElement.length - 13, dateElement.length),
      'MMM. D, YYYY',
    );
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('> div > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~${$el.find('> div > div > p').text().trim()}`,
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
  const titleSelector = '> h1';
  const bodySelector = '> div p';
  const imageSelector = 'img~src';
  const location = 'Boston';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrboston.org/', location);
}

export const parser = new LiteParser(
  'ER_Boston',
  'https://xrboston.org/',
  [
    {
      selector: ['div.grid div.grid-item'],
      parser: threadHandler,
    },
    {
      selector: ['#mainbody > div > div.col-12.col-lg-7.offset-lg-1.bg-white.pb-5 > div.pt-3'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/',
);
