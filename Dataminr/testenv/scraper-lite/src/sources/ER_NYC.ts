import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment(
      $el.find('div.BlogList-item-meta time').attr('datetime'),
      'YYYY-MM-DD',
    );
    if (!postedDate.isSame(moment(), 'day')) return;
    threads.push({
      link: $el
        .find('> a')
        .attr('href')
        .trim()
        .replace(/^.*\/\/[^/]+/, ''),
      title: `${postedDate.format('MM/DD/YYYY')}~N/A`,
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
  const titleSelector = 'h1';
  const bodySelector = 'div.sqs-block-content';
  const imageSelector = 'figure.sqs-block-image-figure div.sqs-image-shape-container-element > img~data-src';
  const location = 'NYC';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    'https://www.xrebellion.nyc/',
    location,
  );
}

export const parser = new LiteParser(
  'ER_NYC',
  'https://www.xrebellion.nyc/',
  [
    {
      selector: ['article'],
      parser: threadHandler,
    },
    {
      selector: ['article.BlogItem'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news',
);
