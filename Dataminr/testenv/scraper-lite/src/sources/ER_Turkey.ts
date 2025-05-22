import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    moment.locale('tr');
    const publishedDate = moment($(el).find('.published').text(), 'll').format('MM/DD/YYYY');
    if (moment(publishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.entry-title a').attr('href');
      const headline = $el.find('.post-content-inner').text();
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

  if (url === 'https://yokolusisyani.org/medya-2/') {
    return posts;
  }
  const titleSelector = 'h1.entry-title';
  const bodySelector = '.entry-content';
  const imageSelector = 'article img~data-src';
  const location = 'Turkey';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://yokolusisyani.org/', location);
}

export const parser = new LiteParser(
  'Extinction Rebellion Turkey',
  'https://yokolusisyani.org/medya-2/',
  [
    {
      selector: ['article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
