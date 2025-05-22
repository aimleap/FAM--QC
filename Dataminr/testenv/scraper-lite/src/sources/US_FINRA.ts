import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('time').text();
    if (moment(publishedDate, 'll').isSame(moment(), 'day')) {
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
  if (url === 'https://www.finra.org/media-center/newsreleases') {
    return posts;
  }
  const title = $el.find('.content h1').text().replace(/\n+/g, '').trim();
  const subHeading = $el.find('.content h2').text().replace(/\n+/g, '').trim();
  const date = $el.find('.content time').text().trim();
  const source = 'US FINRA';
  const fullText = $el
    .find('.layout .content .clearfix.field--type-text-with-summary p')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const timestamp = moment(date, 'LL').unix();

  const newsInfo = `Title: ${title}, Description: ${subHeading}, Date: ${date}, Source: ${source}, "Additional Data:" ${fullText}`;
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
  'US FINRA',
  'https://www.finra.org',
  [
    {
      selector: ['.main-content .views-row'],
      parser: threadHandler,
    },
    {
      selector: ['#page'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/media-center/newsreleases',
);
