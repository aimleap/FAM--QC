import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.capecoral.gov/';
const baseURLSuffix = 'policenewslist.php';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.news-date').text().trim();
    if (moment(articlePublishedDate, 'MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = '.page-title';
  const articleFullTextQuery = '.post';
  const title = fetchText(titleQuery, $, elements);
  const date = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
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

export const parser = new LiteParser('City Of Cape Coral', baseURLPrefix, [
  {
    selector: ['.post>.news'],
    parser: threadHandler,
  },
  {
    selector: ['main'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
