import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.wcjb.com';
const baseURLSuffix = '/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const link = $(el).find('.headline  a.text-reset').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('.headline  a.text-reset').attr('href');
      const headline = $(el).find('.deck').text();
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
  const titleQuery = 'h1';
  const dateQuery = '.published-date-time';
  const articleFullTextQuery = '.article-body p.text:not(:has(i))';
  const title = fetchText(titleQuery, $, elements);
  let dateText = fetchText(dateQuery, $, elements).replace('Published:', '').trim();
  if (dateText === '') {
    dateText = fetchText('.updated-date-time', $, elements).replace('Updated:', '').trim();
  }
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const date = moment(dateText, ['minutes ago', 'hours ago', 'MMM DD, YYYY at hh:mm a']).format('MMM DD, YYYY hh:mm a');
  if (!moment(date, 'MMM DD, YYYY hh:mm a').isSame(moment(), 'day')) return posts;
  const timestamp = moment(date, 'MMM DD, YYYY hh:mm a').unix();
  const articleInfo = `${title}; ${description}`;
  const extraDataInfo = {
    title,
    description,
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

export const parser = new LiteParser('WCJB', baseURLPrefix, [
  {
    selector: ['div.flex-feature'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
