import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://english.onlinekhabar.com/category/social';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const articlePublishedDate = $el.find('.ok-post-hours>span').text();
    if (!articlePublishedDate.includes('day')) {
      const href = $el.find('h2 a').attr('href');
      const headline = $el.find('h2 a').text().trim();
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
  const discussionTitleQuery = 'h1';
  const articleTextQuery = '.post-content-wrap';
  const dateQuery = '.ok-post-date';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
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

export const parser = new LiteParser('Online Khabar', baseURL, [
  {
    selector: ['.ok-details-content-left .listical-news-big .ok-news-post.ltr-post'],
    parser: threadHandler,
  },
  {
    selector: ['.site-main'],
    parser: postHandler,
    name: 'post',
  },
]);
