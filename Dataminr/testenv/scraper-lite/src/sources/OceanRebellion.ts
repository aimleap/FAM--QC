import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { Selectors, extractPosts } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment($(el).find('a>p').text(), 'DD.MM.YYYY').format('MM/DD/YYYY');
    if (moment(publishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a:has(h2)').attr('href');
      const headline = '';
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

  if (url === 'https://oceanrebellion.earth/news') {
    return posts;
  }
  const titleSelector = '.article__heading h1';
  const bodySelector = '.article__block.article__block--text';
  const imageSelector = '.article__block.article__block--image>img~src';
  const location = '';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://oceanrebellion.earth/',
    location,
  );
}

export const parser = new LiteParser('Ocean Rebellion', 'https://oceanrebellion.earth/news', [
  {
    selector: ['.page.news>.news__item'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
