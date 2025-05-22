import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { Selectors, extractPosts } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment($(el).find('time').text(), 'LL');
    if (publishedDate.isSame(moment(), 'day')) {
      const href = $el.find('.entry-title>a').attr('href');
      const description = $el.find('.entry-content').text().replace(/\n+/g, '');
      threads.push({
        link: href,
        title: `${publishedDate.format('MM/DD/YYYY')}~${description}`,
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

  if (url === 'https://xrlambeth.earth/news/') {
    return posts;
  }
  const titleSelector = 'h1.entry-title';
  const bodySelector = '.entry-content';
  const imageSelector = '.entry-main img~data-src';
  const location = 'Lambeth';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrlambeth.earth/', location);
}

export const parser = new LiteParser(
  'Extinction Rebellion Lambeth',
  'https://xrlambeth.earth/news/',
  [
    {
      selector: ['.site-content> article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
