import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { Selectors, extractPosts } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('.card-title>a').attr('href'); // moment($(el).find('a>p').text(), 'DD.MM.YYYY').format('MM/DD/YYYY');
    if (link.includes(todaysDate)) {
      const href = $el.find('.card-title>a').attr('href');
      const headline = $el.find('.card-excerpt').text().replace(/\n+/g, '').trim();
      threads.push({
        link: href,
        title: `${moment(todaysDate, 'YYYY/MM/DD').format('MM/DD/YYYY')}~${headline}`,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === 'https://extinctionrebellion.fr/actualites/') {
    return posts;
  }
  const titleSelector = 'h1.post-title';
  const bodySelector = '.post-content';
  const imageSelector = 'img~src';
  const location = 'Lyon';
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
  'Extinction Rebellion Lyon',
  'https://extinctionrebellion.fr',
  [
    {
      selector: ['#visible-blog-posts .card-body'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/actualites/',
);
