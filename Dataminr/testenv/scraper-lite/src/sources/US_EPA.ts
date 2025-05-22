import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('time').text();
    if (moment(publishedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a').text();
      threads.push({
        link: href,
        title: headline,
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
  if (url === 'https://www.epa.gov/newsreleases/search') {
    return posts;
  }

  const title = $el.find('h1.page-title').text().trim();
  const shortDescription = $el.find('p.usa-intro').text().trim();
  const date = $el.find('.article time').text().replace(/\n+/g, '').trim();
  const source = 'US EPA';
  const additionalData = $el.find('.article p >:not(.usa-intro ,time)').text().trim();
  const timestamp = moment(date, 'LL').unix();
  const newsInfo = `Title: ${title}, Description: ${shortDescription}, Date: ${date}, Source: ${source}, Additional Data: ${additionalData}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'US_EPA',
  'https://www.epa.gov',
  [
    {
      selector: ['.usa-collection__body'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/newsreleases/search',
);
