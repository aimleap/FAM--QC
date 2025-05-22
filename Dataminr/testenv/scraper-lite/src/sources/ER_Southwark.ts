import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment(
      $el
        .find('> div > div > div.eael-entry-wrapper > div.eael-entry-footer > div > span > time')
        .text()
        .trim(),
      'MMMM D, YYYY',
    );
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('> div > div > div.eael-entry-wrapper > header > h2 > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~${$el
        .find('> div > div > div.eael-entry-wrapper > div.eael-entry-content > div p')
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
  const titleSelector = 'div.entry-header > div > h1';
  const bodySelector = 'div.nv-content-wrap.entry-content p';
  const imageSelector = 'img~src';
  const location = 'SouthWark';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrsouthwark.earth/', location);
}

export const parser = new LiteParser(
  'ER_Southwark',
  'https://xrsouthwark.earth/',
  [
    {
      selector: ['article'],
      parser: threadHandler,
    },
    {
      selector: ['article.type-post'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/',
);
