import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://sunlive.co.nz/';
async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text();
    preThreads.push({
      link: href,
      title: headline,
      parserName: 'threads',
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
    const articlePublishedDate = $(el).find('.date>p').text();
    if (moment(articlePublishedDate, 'hh:mma dddd DD MMM, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.post-title>h2>a').attr('href');
      const headline = $(el).find('.post-title>h2>a').text();
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
  const discussionTitleQuery = '.details>h2';
  const dateQuery = 'p:contains(Posted:)';
  const articleTextQuery = '.article-content';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split(':')[1].trim();
  const date = moment(dateText, 'hh:mma dddd DD MMM, YYYY').format('MM/DD/YY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
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

export const parser = new LiteParser('Sunlive', baseURL, [
  {
    selector: ['li.nav-item>a:contains(Traffic & Crashes),li>a:contains(Crime)'],
    parser: preThreadHandler,
  },
  {
    selector: ['.list-post'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body .generic-content'],
    parser: postHandler,
    name: 'post',
  },
]);
