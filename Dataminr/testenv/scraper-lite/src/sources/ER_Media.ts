import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment(
      $el.find('> div.summary-content time').attr('datetime').trim(),
      'YYYY-MM-DD',
    );
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('a.summary-title-link')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~`,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const titleSelector = 'h1.BlogItem-title';
  const bodySelector = 'div.sqs-block-content p';
  const imageSelector = 'img~data-src';
  const location = 'Media';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://www.xrdc.org/', location);
}

export const parser = new LiteParser(
  'ER_Media',
  'https://www.xrdc.org/',
  [
    {
      selector: ['div.summary-item'],
      parser: threadHandler,
    },
    {
      selector: ['article.BlogItem'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/press',
);
