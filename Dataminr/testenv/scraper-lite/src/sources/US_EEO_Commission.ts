import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('.views-field-field-published-date').text();
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
  if (url === 'https://www.eeoc.gov/newsroom?page=0') {
    return posts;
  }
  const title = $el.find('h1 .field').text().replace(/\n+/g, '').trim();
  const date = $el.find('.press-release__site-subheading').text().replace(/\n+/g, '').replace('Press Release ', '')
    .trim();
  const source = 'US EEO Commission';
  const fullText = $el
    .find('.usa-prose.clearfix.text-formatted.field')
    .text()
    .replace(/\n+/g, '')
    .replace(/\r+/g, '')
    .trim();
  const timestamp = moment(date, 'L').unix();

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}`;
  const extraDataInfo = {
    'Additional Data': fullText,
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
  'US EEO Commission',
  'https://www.eeoc.gov',
  [
    {
      selector: ['.views-element-container table tbody tr'],
      parser: threadHandler,
    },
    {
      selector: ['.grid-row'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/newsroom?page=0',
);
