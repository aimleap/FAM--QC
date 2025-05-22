import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.edp24.co.uk';
const baseURLSuffix = '/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('h3 a, h4 a.text-slate').attr('href');
    const headline = $(el).find('h3 a, h4 a.text-slate').text().replace(/\n+/g, ' ')
      .replace(/\t+/g, ' ')
      .trim();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
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
  const articleFullTextQuery = '.article-body';
  const title = fetchText(titleQuery, $, elements);
  const date = $(elements).find('time').attr('datetime');
  if (!moment(date, 'YYYY-MM-DD hh:mm:ss').isSame(moment(), 'day')) return posts;
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const subtitle = data[0];
  const timestamp = moment(date, 'YYYY-MM-DD hh:mm:ss').unix();
  const articleInfo = `norfolk_uk: ${title}`;
  const extraDataInfo = {
    title: `norfolk_uk: ${title}`,
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

export const parser = new LiteParser('Eastern Daily Press', baseURLPrefix, [
  {
    selector: ['article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
