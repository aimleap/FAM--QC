import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('td.u-w15pct > .datetime').text();
    if (moment(publishedDate, 'll').isSame(moment(), 'day')) {
      const href = $el.find('.u-w65pct a').attr('href');
      const type = $el.find('.u-w20pct').text().replace('Category:', '').replace(/\n+/g, '')
        .trim();
      threads.push({
        link: href,
        title: type,
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
  const $el = $(elements);
  if (url === 'https://www.consumerfinance.gov/activity-log/') {
    return posts;
  }
  const title = $el.find('.o-item-introduction h1').text().trim();
  const subHeading = $el.find('.lead-paragraph').text().trim();
  const date = $el.find('.content_main .datetime').text().replace(/\n+/g, '').trim();
  const source = 'US Consumer Financial Protection Bureau';
  const type = data[0];
  const additionalData = $el.find('.m-full-width-text').text().trim();
  const timestamp = moment(date, 'll').unix();
  const newsInfo = `Title: ${title}, Description: ${subHeading}, Date: ${date}, Source: ${source}, Type: ${type}, Additional Data: ${additionalData}`;
  const extraDataInfo = {
    'Additional Data': `${additionalData}`,
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
  'Consumer Financial Protection Bureau',
  'https://www.consumerfinance.gov',
  [
    {
      selector: ['table tbody tr:not(.u-visually-hidden)'],
      parser: threadHandler,
    },
    {
      selector: ['.content_main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/activity-log/',
);
