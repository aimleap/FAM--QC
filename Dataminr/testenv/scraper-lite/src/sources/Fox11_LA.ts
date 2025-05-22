import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.foxla.com';
const baseURLSuffix = '/news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('h3.title a').attr('href');
    const headline = $(el).find('.dek').text().replace(/\n+/g, ' ')
      .replace(/\t+/g, ' ')
      .trim();
    if (!href.startsWith('/video/')) {
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1.headline';
  const dateQuery = '.article-date time';
  const articleFullTextQuery = '.article-body p:not(:has(a))';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  if (!moment(date, 'MMM DD, YYYY hh:mm a').isSame(moment(), 'day')) return posts;
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const subtitle = data[0] !== null ? data[0] : '';
  const timestamp = moment(date, 'MMM DD, YYYY hh:mm a').unix();
  const articleInfo = `california: ${title} ; ${subtitle}`;
  const extraDataInfo = {
    title: `california: ${title}`,
    subtitle,
    articleFullText,
    date,
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

export const parser = new LiteParser('FOX 11 LA', baseURLPrefix, [
  {
    selector: ['.main-content article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
