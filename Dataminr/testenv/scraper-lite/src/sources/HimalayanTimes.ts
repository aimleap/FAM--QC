import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://thehimalayantimes.com/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://thehimalayantimes.com/nepal';
  const link2 = 'https://thehimalayantimes.com/kathmandu';
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
    const href = $(el).find('a').attr('href');
    const headline = $(el).find('a').text();
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
  if (url === baseURL) return posts;
  const discussionTitleQuery = 'h1.alith_post_title';
  const articleTextQuery = '.post-content p';
  const dateQuery = '.article_date';
  const dateText = fetchText(dateQuery, $, elements).split('Published:')[1].trim();
  const date = moment(dateText, 'hh:mm a MMM DD, YYYY').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'hh:mm a MMM DD, YYYY').unix();
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

export const parser = new LiteParser('Himalayan Times', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.ht-homepage-left-one-article h3.alith_post_title, .ht-homepage-left-articles h3, .ht-more-from-section-list h3'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['article.articleDetails'],
    parser: postHandler,
    name: 'post',
  },
]);
