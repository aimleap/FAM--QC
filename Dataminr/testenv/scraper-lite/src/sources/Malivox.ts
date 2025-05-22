import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://malivox.net/';
moment.locale('fr');
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
    const articlePublishedDate = $(el).find('.entry-meta-date a').text();
    if (moment(articlePublishedDate, 'LL').isSame(moment(), 'day')) {
      const href = $(el).find('h3.entry-title a').attr('href');
      const headline = $(el).find('h3.entry-title').text();
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

  $(elements).find('strong').remove();
  const discussionTitleQuery = 'h1.entry-title';
  const dateQuery = '.entry-header .entry-meta-date a';
  const articleTextQuery = 'article .entry-content p, article .entry-content h2';
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'LL').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
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

export const parser = new LiteParser('Malivox', baseURL, [
  {
    selector: ['.mh-header .mh-navigation ul li:contains(Sécurité), .mh-header .mh-navigation ul li:contains(People & Faits-divers)'],
    parser: preThreadHandler,
  },
  {
    selector: ['#main-content article'],
    parser: threadHandler,
    name: 'threadHandler',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
