import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.aerotime.aero/category/defense';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.cs-meta-date').text().trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.cs-entry__title a').attr('href');
      const headline = $(el).find('.cs-entry__title a').text().trim();
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
  if (url === baseURL) return [];
  const discussionTitleQuery = 'h1.cs-entry__title';
  const dateQuery = '.cs-entry__header-info .cs-entry__post-meta .cs-meta-date';
  const articleTextQuery = '.entry-content';
  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'YYYY-MM-DD').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${discussionTitle}`;
  const extraDataInfo = {
    articleText,
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

export const parser = new LiteParser('AeroTime', baseURL, [
  {
    selector: ['.cs-content-area .cs-posts-area-posts article .cs-entry__inner.cs-entry__content'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
