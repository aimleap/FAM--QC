import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment($(el).find('.post-item-date').text(), 'LL');
    if (publishedDate.isSame(moment(), 'day')) {
      const href = $el.find('h3>a').attr('href');
      const headline = $el.find('.post-item-date+div').text();
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

  if (url === 'https://extinctionrebellion.se/press/') {
    return posts;
  }
  const titleSelector = 'h1.post-title';
  const bodySelector = '.post-content>.container>*:not(h1,ul,.post-date)';
  const imageSelector = '';
  const location = 'Sverige';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://extinctionrebellion.se/',
    location,
  );
}

export const parser = new LiteParser(
  'Extinction Rebellion Sverige',
  'https://extinctionrebellion.se/press/',
  [
    {
      selector: ['#content main>.page-content article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
