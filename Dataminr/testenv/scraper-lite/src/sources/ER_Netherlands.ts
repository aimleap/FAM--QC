import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment($(el).find('time').text(), 'DD/MM/YYYY');
    if (publishedDate.isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('.wp-block-latest-posts__post-excerpt').text();
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

  if (url === 'https://extinctionrebellion.nl/en/press-and-news/') {
    return posts;
  }
  const titleSelector = 'h1';
  const bodySelector = 'div p';
  const imageSelector = 'img~src';
  const location = 'Netherlands';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://extinctionrebellion.nl/',
    location,
  );
}

export const parser = new LiteParser(
  'Extinction Rebellion Netherlands',
  'https://extinctionrebellion.nl/en/press-and-news/',
  [
    {
      selector: ['ul.wp-block-latest-posts li'],
      parser: threadHandler,
    },
    {
      selector: ['article'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
