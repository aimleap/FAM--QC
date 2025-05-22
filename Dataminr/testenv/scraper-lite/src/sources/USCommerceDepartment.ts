import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const releasedDate = $el.find('time').text().trim();
    if (moment(releasedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('h2 a').attr('href');
      const title = $el.find('h2 a').text().trim();
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
  if (url === 'https://www.commerce.gov/news/press-releases') {
    return posts;
  }

  const postTitle = $el.find('h1.page-title').text().trim();
  const description = $el
    .find('article .field--type-text-with-summary')
    .text()
    .substr(0, 200)
    .replace(/\n+/g, '')
    .trim();
  const date = moment($el.find('article time').text().trim(), 'dddd, LL').format('MM/DD/YYYY');
  const source = 'US Commerce Department';
  const type = 'Press Releases';
  const additionalData = $el
    .find('article .field--type-text-with-summary')
    .text()
    .trim()
    .replace(/\n+/g, '');
  const timeStamp = moment(date, 'MM/DD/YYYY').unix();

  const newsInfo = `Title: ${postTitle}, Description: ${description}, Date: ${date}, Source: ${source}, Type: ${type}, Additional Data: ${additionalData}`;
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
  'US Commerce Department',
  'https://www.commerce.gov',
  [
    {
      selector: ['.region-content .view-content article'],
      parser: threadHandler,
    },
    {
      selector: ['.region.region-content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/press-releases',
);
