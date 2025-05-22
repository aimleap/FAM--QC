import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.ottawapolice.ca/modules/news/en';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.blogPostDate p').text().replace('Posted on', '')
      .trim();
    if (moment(articlePublishedDate, 'dddd, MMMM DD, YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = $(el).find('h2 a.newsTitle').attr('href');
      threads.push({
        link: href,
        title: articlePublishedDate,
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
  const titleQuery = '#pageHeading';
  const articleFullTextQuery = '#printAreaContent';
  const title = fetchText(titleQuery, $, elements);
  const date = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'dddd, MMMM DD, YYYY hh:mm a').unix();
  const articleInfo = `${title} ; ${date} ; ${articleFullText}`;
  const extraDataInfo = {
    title,
    date,
    articleFullText,
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

export const parser = new LiteParser('Ottawa Police Service', baseURL, [
  {
    selector: ['.blogItem'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
