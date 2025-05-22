import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://charlottetownpolice.com/category/police-reports/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.post-meta>.published').text().trim();
    if (moment(articlePublishedDate, 'MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.entry-title a').attr('href');
      const title = $(el).find('.entry-title a').text();
      threads.push({
        link: href,
        title,
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
  const titleQuery = '.entry-title';
  const dateQuery = '.post-meta>.published';
  const fileNumberQuery = 'p:contains(File:)';
  const articleFullTextQuery = '.entry-content';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const fileNumber = fetchText(fileNumberQuery, $, elements).replace('File:', '').trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${fileNumber} ; ${articleFullText}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
    'File Number': fileNumber,
    Text: articleFullText,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Charlottetown Police Department', baseURL, [
  {
    selector: ['#content-area #left-area article'],
    parser: threadHandler,
  },
  {
    selector: ['#content-area article'],
    parser: postHandler,
    name: 'post',
  },
]);
