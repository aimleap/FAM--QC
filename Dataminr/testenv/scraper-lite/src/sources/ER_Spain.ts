import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment($el.find('> a').attr('href')?.trim().substr(6, 15), 'YYYY/MM/DD');
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el.find('> a').attr('href').trim(),
      title: `${postedDate.format('MM/DD/YYYY')}~${$el.find('p.text-lg').text().trim()}`,
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
  const titleSelector = 'h1';
  const bodySelector = 'article';
  const imageSelector = 'article img~src';
  const location = 'Spain';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://www.extinctionrebellion.es/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_Spain',
  'https://www.extinctionrebellion.es/',
  [
    {
      selector: ['div.toggle-section.blog-section.flex.flex-wrap.items-stretch.my-1.mx-1 > div'],
      parser: threadHandler,
    },
    {
      selector: ['body > div > div.page.mb-16'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/blog.html',
);
