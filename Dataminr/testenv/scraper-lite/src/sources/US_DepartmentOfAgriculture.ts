import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('.news-release-date').text();
    if (moment(publishedDate, 'll').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = publishedDate;
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const $el = $(elements);
  if (url === 'https://www.usda.gov/media/press-releases') {
    return posts;
  }
  const title = $el.find('h1.usda-page-title').text().replace(/\n+/g, '').trim();
  const date = data[0];
  const source = 'US Dept of Agriculture';
  const fullText = $el
    .find('#block-usda-content div:not(p,strong) p')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const timestamp = moment(date, 'll').unix();

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}, "Additional Data:" ${fullText}`;
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
  'US Department of Agriculture',
  'https://www.usda.gov',
  [
    {
      selector: ['.news-releases .news-releases-item'],
      parser: threadHandler,
    },
    {
      selector: ['#main-content .usa-layout-docs-main_content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/media/press-releases',
);
