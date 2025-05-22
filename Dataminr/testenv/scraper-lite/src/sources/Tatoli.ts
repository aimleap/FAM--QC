import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://en.tatoli.tl';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://en.tatoli.tl/category/national/';
  const link2 = 'https://en.tatoli.tl/category/defence/';
  const link3 = 'https://en.tatoli.tl/category/security/';
  const urls = [link1, link2, link3];
  for (let i = 0; i < urls.length; i++) {
    for (let j = 1; j < 3; j++) {
      preThreads.push({
        link: `${urls[i]}page/${j}/`,
        parserName: 'threads',
      });
    }
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return threads;
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const postUrl = $(el).find('.clip-3 a').attr('href');
    if (postUrl.includes(todaysDate)) {
      const href = $(el).find('.clip-3 a').attr('href');
      const headline = $(el).find('.clip-3 a').text().trim();
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
  const discussionTitleQuery = 'h1.post-title';
  const dateQuery = '.article-date';
  const articleTextQuery = '.post-content';
  const dateText = fetchText(dateQuery, $, elements).replace('DILI', '');
  const date = moment(dateText, 'YYYY/MM/DD hh:mm:ss a').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY/MM/DD hh:mm:ss a').unix();
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

export const parser = new LiteParser('Tatoli', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['#stickyContent article'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['#stickyContent'],
    parser: postHandler,
    name: 'post',
  },
]);
