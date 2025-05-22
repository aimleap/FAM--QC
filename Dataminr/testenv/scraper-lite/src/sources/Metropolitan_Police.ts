import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://news.met.police.uk';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://news.met.police.uk/news?q=';
  const link2 = 'https://news.met.police.uk/latest_news';
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
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('time').attr('datetime').split(' ')[0].trim();
    if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).attr('href');
      const headline = $(el).find('.panel__heading').text().replace(/\n+/g, ' ')
        .trim();
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
  const $el = $(elements);
  const titleQuery = 'h1.panel__title';
  const descriptionQuery = '.panel__text p strong';
  const articleFullTextQuery = '.entry-content';
  const title = fetchText(titleQuery, $, elements);
  const date = $el.find('.type__date time').attr('datetime');
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD hh:mm:ss').unix();
  const articleInfo = `${date} ; ${title} ; ${description}`;
  const extraDataInfo = {
    title,
    description,
    articleFullText,
    date,
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
  'Metropolitan Police',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.grid.js-material-grid a'],
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
