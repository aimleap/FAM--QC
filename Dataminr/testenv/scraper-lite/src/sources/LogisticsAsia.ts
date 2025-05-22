import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://logistics.asia/category/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.jeg_meta_date').text();
    if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
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
  const titleQuery = '.entry-header .jeg_post_title';
  const descriptionQuery = '.entry-content';
  const publishedDateQuery = '.entry-header .jeg_meta_date';
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

export const parser = new LiteParser('Logistics Asia', baseURL, [
  {
    selector: ['article.jeg_post'],
    parser: threadHandler,
  },
  {
    selector: ['.jeg_main_content .jeg_inner_content'],
    parser: postHandler,
    name: 'post',
  },
]);
