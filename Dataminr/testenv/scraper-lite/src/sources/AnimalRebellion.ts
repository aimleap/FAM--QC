import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment($(el).find('time').text(), 'Do MMMM YYYY').format('MM/DD/YYYY');
    if (moment(publishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('.wp-block-latest-posts__post-excerpt').text();
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

  if (url === 'https://animalrebellion.org/press/') {
    return posts;
  }

  const titleSelector = 'h1.tg-page-header__title';
  const bodySelector = 'div.entry-content';
  const imageSelector = 'article .post-thumbnail img~data-src';
  const location = '';

  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://animalrebellion.org/',
    location,
  );
}

export const parser = new LiteParser('Animal Rebellion', 'https://animalrebellion.org/press/', [
  {
    selector: ['.entry-content ul.wp-block-latest-posts li'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
