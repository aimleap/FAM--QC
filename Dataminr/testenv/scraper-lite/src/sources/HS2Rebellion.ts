import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment($(el).find('time').text(), 'LL');
    if (publishedDate.isSame(moment(), 'day')) {
      const href = $el.find('h2 a').attr('href');
      const headline = $el.find('.eael-grid-post-excerpt>p').text();
      threads.push({
        link: href,
        title: `${publishedDate.format('MM/DD/YYYY')}~${headline}`,
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
  if (url === 'https://www.hs2rebellion.earth/news/') {
    return posts;
  }
  const titleSelector = 'h2.entry-title';
  const bodySelector = 'div.entry-content';
  const imageSelector = 'article .thumbnail img, div.entry-content:not(div.sharedaddy,div#jp-relatedposts) img~src';
  const location = '';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://www.hs2rebellion.earth/',
    location,
  );
}

export const parser = new LiteParser(
  'HS2 Rebellion',
  'https://www.hs2rebellion.earth/',
  [
    {
      selector: ['body article'],
      parser: threadHandler,
    },
    {
      selector: ['body.single-post'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/',
);
