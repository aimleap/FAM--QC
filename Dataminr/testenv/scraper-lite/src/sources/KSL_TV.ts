import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.ksl.com';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://ksltv.com/category/local/';
  const link2 = 'https://ksltv.com/category/us/';
  const link3 = 'https://ksltv.com/category/kslinvestigates/';

  const urls = [link1, link2, link3];
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
    const href = $(el).find('h3 a').attr('href');
    const headline = $(el).find('h3 a').text().trim();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) {
    return posts;
  }

  const $el = $(elements);
  const dateText = $el.find('.article .date span:not(span:contains(Updated))').text();
  const date = moment(dateText, 'MMM DD, YYYY hh:mm a').format('MM/DD/YYYY hh:mm');

  if (moment(date, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) {
    const titleQuery = '.article h1';
    const articleFullTextQuery = '.article .story_body p';

    const title = fetchText(titleQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(date, 'MM/DD/YYYY').unix();
    const articleInfo = `${title}`;
    const extraDataInfo = {
      title,
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
  }
  return posts;
}

export const parser = new LiteParser(
  'KSL TV',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.flex_division'],
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
