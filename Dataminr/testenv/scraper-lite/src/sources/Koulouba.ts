import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://koulouba.com/';
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
    const articlePublishedDate = $(el).find('time.entry-date.published').text();
    if (moment(articlePublishedDate, 'DD/MM/YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.entry-title a').attr('href');
      const headline = $(el).find('.entry-title a').text();
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
  if (url === baseURL) {
    return posts;
  }
  const discussionTitleQuery = 'h1.entry-title';
  const dateQuery = '.entry-date.published';
  const articleTextQuery = '.entry-content';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'DD/MM/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
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

export const parser = new LiteParser('Koulouba', baseURL, [
  {
    selector: ['ul.menu li:contains(Nord-Mali),ul.menu li:contains(Faits divers),ul.menu li:contains(Crise malienne)'],
    parser: preThreadHandler,
  },
  {
    selector: ['.masonry article'],
    parser: threadHandler,
    name: 'threadHandler',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
