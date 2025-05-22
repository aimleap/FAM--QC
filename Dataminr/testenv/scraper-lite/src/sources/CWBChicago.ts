import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://cwbchicago.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.entry-meta-date').text().trim();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = $(el).find('.entry-title.mh-posts-list-title a').attr('href');
      const headline = $(el).find('.mh-excerpt').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, '')
        .trim();
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const titleQuery = 'h1.entry-title';
  const dateQuery = '.entry-meta-date';
  const articleFullTextQuery = '#main-content .entry-content p';
  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const source = 'CWBChicago';
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMMM DD, YYYY hh:mm a').unix();
  const articleInfo = `Chicago: ${title}; ${dateText}; ${source}; ${description}`;
  const extraDataInfo = {
    title: `Chicago: ${title}`,
    date: dateText,
    source,
    description,
    articleFullText,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser('CWBChicago', baseURL, [
  {
    selector: ['#main-content article'],
    parser: threadHandler,
  },
  {
    selector: ['#main-content'],
    parser: postHandler,
    name: 'post',
  },
]);
