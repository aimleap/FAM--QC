import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.leicestermercury.co.uk/news';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 3; index++) {
    preThreads.push({
      link: `${baseURL}?page=${index}`,
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
    const href = $el.find('.headline').attr('href');
    const headline = $el.find('.headline').text();
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
  const date = $el.find('.time-info li:eq(0)').text().split(',')[1].trim();
  const formattedDate = moment(date, 'DD MMM YYYY').format('MM/DD/YY');

  if (moment(formattedDate, 'MM/DD/YY').isSame(moment(), 'day')) {
    const titleQuery = 'h1.publication-font';
    const textQuery = '.content-column .article-body p';

    const text = fetchText(textQuery, $, elements);
    const title = fetchText(titleQuery, $, elements);

    const timestamp = moment(formattedDate, 'MM/DD/YY').unix();
    const textInfo = `Text: ${text}`;
    const extraDataInfo = {
      discussion_title: title,
    };

    posts.push(
      new Post({
        text: textInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Leicester Mercury',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.channel-news .teaser'],
      parser: threadHandler,
      name: 'thread',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
