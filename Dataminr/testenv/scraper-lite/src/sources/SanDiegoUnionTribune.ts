import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.sandiegouniontribune.com';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.sandiegouniontribune.com/local';
  const link2 = 'https://www.sandiegouniontribune.com/news/border-baja-california';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'threads',
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
  if (url === baseURL) return threads;
  const todaysDate = moment().format('YYYY-MM-DD');
  elements.forEach((el) => {
    const hrefLink = $(el).find('.promo-title a.link').attr('href');
    if (hrefLink.includes(todaysDate)) {
      const href = $(el).find('.promo-title a.link').attr('href');
      const title = $(el).find('.promo-title a.link').text().trim();
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
  if (url === baseURL) return posts;
  const titleQuery = 'h1.headline';
  const dateQuery = '.published-date-day';
  const descriptionQuery = '.subheadline';
  const articleFullTextQuery = '.ct-rich-text-children';
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMM. DD, YYYY').unix();
  const articleInfo = `${title}; ${description}`;
  const extraDataInfo = {
    title,
    description,
    articleFullText,
    date,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('San Diego Union Tribune', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['div.list-items-item, ul.list-menu.list-i-menu li, ul.list-menu.list-h-menu li'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['.page-content'],
    parser: postHandler,
    name: 'post',
  },
]);
