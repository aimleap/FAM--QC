import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://malibook.net/';
const todaysDate = moment().format('YYYY/MM/DD');
async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('a').text();
    preThreads.push({
      link: href,
      title: headline,
      parserName: 'threadHandler',
    });
  });
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
    const link = $(el).find('a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('a').attr('href');
      const headline = $(el).find('a h2').text();
      threads.push({
        link: href,
        title: `${todaysDate}~${headline}`,
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

  const discussionTitleQuery = 'h1.entry-title';
  const articleTextQuery = '.post-cont-out #content-main > p';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const date = data[1].split('~')[0];
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY/MM/DD').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    date,
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

export const parser = new LiteParser('Mali Book', baseURL, [
  {
    selector: ['.menu-main-menu-container ul li:contains(Actualité), .menu-main-menu-container ul li:contains(SÉCURITÉ & TERRORISME)'],
    parser: preThreadHandler,
  },
  {
    selector: ['.relative .relative .home-feat-main, .infinite-content .infinite-post'],
    parser: threadHandler,
    name: 'threadHandler',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
