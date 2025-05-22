import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const postDate = $el.find('.search-result-display-date').text().trim();
    if (moment(postDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('h5 a.search-result-title').attr('href');
      const title = $el.find('h5 a.search-result-title').text().trim();
      threads.push({
        link: href,
        title,
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
): Promise<Post[]> {
  const posts: Post[] = [];
  const $el = $(elements);
  if (url === 'https://www.energy.gov/listings/energy-news') {
    return posts;
  }

  const postTitle = $el.find('h1.page-title').text().trim();
  const description = $el
    .find('article .layout-inner-content')
    .text()
    .substr(0, 200)
    .replace(/\n+/g, '')
    .trim();
  const date = moment($el.find('.page-hero-date').text().trim(), 'LL').format('MM/DD/YYYY');
  const source = 'US DOE';
  const additionalData = $el
    .find('article .layout-inner-content')
    .text()
    .trim()
    .replace(/\n+/g, '');
  const timeStamp = moment(date, 'MM/DD/YYYY').unix();

  const newsInfo = `Title: ${postTitle}, Description: ${description}, Date: ${date}, Source: ${source}, Additional Data: ${additionalData}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timeStamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'US DOE',
  'https://www.energy.gov',
  [
    {
      selector: ['article div.layout .search-results>.search-result'],
      parser: threadHandler,
    },
    {
      selector: ['main.container'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/listings/energy-news',
);
