import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment($el.find('> time').text().trim(), 'D MMMM YYYY');
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el.find('> a').attr('href').trim(),
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
  const titleSelector = 'div.post__header > h1';
  const bodySelector = 'div.type';
  const imageSelector = 'div.type img~src';
  const location = 'Godalming';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://www.xrgodalming.org/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_Godalming',
  'https://www.xrgodalming.org/',
  [
    {
      selector: ['#content > div.container > div > div.type > ul > li'],
      parser: threadHandler,
    },
    {
      selector: ['div.post__content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/',
);
