import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = moment(
      $(el).find('div.summary-metadata-container--below-content time').text(),
      'll',
    );
    if (publishedDate.isSame(moment(), 'day')) {
      const href = $el.find('a.summary-title-link').attr('href');
      const headline = $el.find('a.summary-title-link').text();
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

  if (url === 'https://www.xrdc.org/press') {
    return posts;
  }
  const titleSelector = 'h1.BlogItem-title';
  const bodySelector = 'div.sqs-block-content';
  const imageSelector = 'article .image-block-wrapper img.thumb-image~data-src';
  const location = 'Washington DC';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://www.xrdc.org', location);
}

export const parser = new LiteParser(
  'Extinction Rebellion Washington DC',
  'https://www.xrdc.org',
  [
    {
      selector: ['div.summary-block-wrapper div.summary-item'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/press',
);
