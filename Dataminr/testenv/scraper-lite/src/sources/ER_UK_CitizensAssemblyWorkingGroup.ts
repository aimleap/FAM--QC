import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { Selectors, extractPosts } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const date = $(el).find('.tease-post__meta').text().split('by')[0];
    const publishedDate = moment(date, 'LL').format('MM/DD/YYYY');
    if (moment(publishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h2>a').attr('href');
      const headline = $el.find('.tease-post__preview').text().replace(/\n+/g, '');
      threads.push({
        link: href,
        title: `${publishedDate}~${headline}`,
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

  if (url === 'https://extinctionrebellion.uk/news/') {
    return posts;
  }
  const titleSelector = 'h1.page-title';
  const bodySelector = '.post-type-post p:not(.post_date)';
  const imageSelector = '.wp-block-image img~data-src';
  const location = 'UK Citizens Assembly Working Group';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://extinctionrebellion.uk/',
    location,
  );
}

export const parser = new LiteParser(
  'Extinction Rebellion UK Citizens Assembly Working Group',
  'https://extinctionrebellion.uk/news/',
  [
    {
      selector: ['.news .posts__grid article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
