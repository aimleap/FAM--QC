import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.20minutes.fr';
const todaysDate = moment().format('YYYYMMDD');

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.20minutes.fr/bordeaux/';
  const link2 = 'https://www.20minutes.fr/nantes/';
  const link3 = 'https://www.20minutes.fr/toulouse/';
  const link4 = 'https://www.20minutes.fr/marseille/';
  const link5 = 'https://www.20minutes.fr/actu-generale/';
  const urls = [link1, link2, link3, link4, link5];
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
    const link = $(el).find('a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('a').attr('href');
      const headline = $(el).find('h2.teaser-title').text().replace(/\n+/g, ' ')
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
  const titleQuery = 'h1.nodeheader-title';
  const descriptionQuery = '.hat .hat-summary';
  const articleFullTextQuery = '.content > p';
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const date = $el.find('.datetime time:eq(0)').attr('datetime')?.split('T')[0];
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const articleInfo = `${title} ; ${description} ; ${date}`;
  const extraDataInfo = {
    title,
    description,
    date,
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
  '20 Minutes',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.list article'],
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
