import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.haltonpolice.ca';
const todaysDate = moment().format('MMMM DD, YYYY hh:mm a');

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.haltonpolice.ca/Modules/News/en/caughtontape';
  const link2 = 'https://www.haltonpolice.ca/Modules/News/en/mediareleases';
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
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $(el).find('.blogPostDate').text();
    if (date.includes(todaysDate)) {
      const href = $el.find('h2 a').attr('href');
      const description = $el.find('.blogItem-contentContainer > p').text().replace(/\n+/g, ' ').replace(/\t+/g, ' ')
        .trim();
      threads.push({
        link: href,
        title: description,
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
  if (url === baseURL) return [];
  const headlineQuery = 'div h1';
  const textQuery = '.ge-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const description = data[1];
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(todaysDate, 'MMMM DD, YYYY hh:mm a').unix();
  const textInfo = `${headline} ; ${todaysDate} ; ${description}`;
  const extraDataInfo = {
    headline,
    todaysDate,
    description,
    text,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Halton Regional Police Service',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['#blogContentContainer .blogItem'],
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
