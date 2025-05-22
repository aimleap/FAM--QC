import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://fpdct.com/blog/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    let articlePublishedDate = $(el).find('.post_info_date').text();
    if (articlePublishedDate.includes('days ago')) {
      const numberOfDays = articlePublishedDate.replace('days ago', '').trim();
      articlePublishedDate = moment().subtract(Number(numberOfDays) + 1, 'days').format('MM/DD/YYYY');
    } else {
      articlePublishedDate = moment(articlePublishedDate, 'MMMM DD, YYYY').format('MM/DD/YYYY');
    }
    if (moment(articlePublishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.post_title a').attr('href');
      const title = articlePublishedDate;
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const titleQuery = 'h1.entry-title';
  const articleFullTextQuery = '.post_content';
  $(elements).find('.sharedaddy').remove();
  const title = fetchText(titleQuery, $, elements);
  const date = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${articleFullText}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
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

export const parser = new LiteParser('Fairfield Ploice Department', baseURL, [
  {
    selector: ['.content article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
