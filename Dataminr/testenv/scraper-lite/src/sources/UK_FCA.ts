import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://www.fca.org.uk/news/search-results?np_category=news%20stories%2Cpress%20releases%2Cstatements%2Cspeeches%2Cnewsletters';
async function preThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 0; index < 10; index++) {
    preThreads.push({
      link: `${url}&start=${index * 10 + 1}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const releaseDate = $(el).find('.published-date').text().split(':')[1].trim();
    if (moment(releaseDate, 'DD/MM/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.search-item__title a').attr('href');
      const headline = $el.find('.search-item__title a').text().replace(/\n+/g, '');
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
  if (url === baseURL) return posts;
  const postTitle = $(elements).find('h1.page-header').text().replace(/\n+/g, '')
    .trim();
  const description = $(elements)
    .find('.copy-highlighted .container')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const firstPublished = $(elements)
    .find('.article-meta>.pubdate:not(.pubdate.latest)')
    .text()
    .replace(/\t+/g, '')
    .trim();
  const lastUpdated = $(elements)
    .find('.article-meta>.pubdate.latest')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const source = 'UK FCA';
  const type = $(elements).find('.article-meta>.type').text().replace(/\n+/g, '')
    .trim();
  const fullText = $(elements)
    .find('article .copy-block.component')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const firstPublishedDate = $(elements)
    .find('.article-meta>.pubdate:not(.pubdate.latest)')
    .text()
    .split(':')[1]
    .trim();
  const timestamp = moment(firstPublishedDate, 'DD/MM/YYYY').unix();

  const newsInfo = `Title: ${postTitle}, Discription: ${description}, Date: ${firstPublished}; ${lastUpdated}, Source: ${source}, Type: ${type}`;
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

export const parser = new LiteParser('UK FCA', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.search-list>.search-item'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['.region-content'],
    parser: postHandler,
    name: 'post',
  },
]);
