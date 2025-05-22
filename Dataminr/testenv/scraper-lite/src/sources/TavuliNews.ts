import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.tavulinews.com.sb';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.tavulinews.com.sb/category/news/';
  const link2 = 'https://www.tavulinews.com.sb/category/feature/';
  const link3 = 'https://www.tavulinews.com.sb/category/economy/';
  const link4 = 'https://www.tavulinews.com.sb/category/sport/';
  const link5 = 'https://www.tavulinews.com.sb/category/regional/';
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
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return threads;
  elements.forEach((el) => {
    const date = $(el).find('.jeg_meta_date').text();
    if (moment(date, 'DD/MM/YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.jeg_post_title>a').attr('href');
      const headline = $(el).find('.jeg_post_title').text();
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
  const titleQuery = 'h1.jeg_post_title';
  const descriptionQuery = '.entry-content';
  const publishedDateQuery = '.jeg_meta_container .jeg_meta_date';
  const publishedDate = fetchText(publishedDateQuery, $, elements).trim();
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const timestamp = moment(publishedDate, 'MMMM DD, YYYY').unix();
  const newsInfo = `${title}; ${publishedDate}; ${description}`;
  const extraDataInfo = {
    Title: title, Description: description, Date: publishedDate,
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

export const parser = new LiteParser('Tavuli News', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.jeg_main_content article.jeg_post'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['.jeg_main_content .jeg_inner_content'],
    parser: postHandler,
    name: 'post',
  },
]);
