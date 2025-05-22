import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment($(el).find('.postTime').text(), 'LL').format('MM/DD/YYYY');
    if (moment(publishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a.oxy-post-title').attr('href');
      const headline = $el.find('.oxy-post-content').text().replace(/\n+/g, '');
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

  if (url === 'https://xr-southeast.uk/news/') {
    return posts;
  }
  const titleSelector = '.ct-headline';
  const bodySelector = '.ct-inner-content';
  const imageSelector = '';
  const location = 'South East UK';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xr-southeast.uk/', location);
}

export const parser = new LiteParser(
  'Extinction Rebellion South East UK',
  'https://xr-southeast.uk/news/',
  [
    {
      selector: ['.oxy-posts>.oxy-post'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
