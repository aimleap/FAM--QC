import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment(
      $el.find('> div > a').attr('href')?.trim().substring(6, 16),
      'YYYY/MM/DD',
    );
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('> div > a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~${$el
        .find('> div > div > div.card-excerpt')
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
  const titleSelector = '> header > h1';
  const bodySelector = 'div.post-content p';
  const imageSelector = 'article img~src';
  const location = 'France';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://extinctionrebellion.fr/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_France',
  'https://extinctionrebellion.fr/',
  [
    {
      selector: ['#visible-blog-posts > div:nth-child(3) > div'],
      parser: threadHandler,
    },
    {
      selector: ['article.post-container'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/actualites/',
);
