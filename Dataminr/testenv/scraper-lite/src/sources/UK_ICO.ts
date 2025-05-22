import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('.text-small').text().split(',')[0].trim();
    if (moment(publishedDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a h2').text();
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
  if (url === 'https://ico.org.uk/about-the-ico/news-and-events/news-and-blogs/') {
    return posts;
  }
  const postTitle = $(elements).find('h1').text().replace(/\n+/g, '')
    .trim();
  const date = $(elements).find('.text-small>dt:contains(Date)+dd').text().trim();
  const source = 'UK ICO';
  const type = $(elements)
    .find('.text-small>dt:contains(Type)+dd')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const fullText = $(elements).find('.article-content').text().replace(/\n+/g, '')
    .trim();
  const timestamp = moment(date, 'DD MMMM YYYY').unix();

  const newsInfo = `Title: ${postTitle}, Date: ${date}, Source: ${source}, Type: ${type}`;
  const extraDataInfo = { 'Additional Data': fullText };
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
  'UK ICO',
  'https://ico.org.uk',
  [
    {
      selector: ['.resultlist>.itemlink'],
      parser: threadHandler,
    },
    {
      selector: ['article.container'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/about-the-ico/news-and-events/news-and-blogs/',
);
