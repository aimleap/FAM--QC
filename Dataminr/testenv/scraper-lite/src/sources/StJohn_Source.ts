import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://stjohnsource.com';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://stjohnsource.com/category/news/police-courts/';
  const link2 = 'https://stjohnsource.com/category/news/local-news/';
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
  if (url === baseURL) {
    return threads;
  }
  elements.forEach((el) => {
    const postDate = $(el).find('time').attr('datetime').split('T')[0].trim();
    if (moment(postDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('h3 a').attr('href');
      const headline = $(el).find('h3').text().trim();
      const description = $(el).find('.td-module-meta-info .td-excerpt').text().trim();
      threads.push({
        link: href,
        title: `${description}~${headline}`,
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
  if (url === baseURL) {
    return posts;
  }

  const $el = $(elements);
  const titleQuery = 'h1.tdb-title-text';
  const articleFullTextQuery = '.pf-content p';

  const title = fetchText(titleQuery, $, elements);
  const date = $el.find('.tdb-post-meta time.entry-date').text();
  const description = data[1].split('~')[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${description}`;
  const extraDataInfo = {
    title,
    description,
    articleFullText,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser(
  'St. John Source',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.td_module_flex'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
