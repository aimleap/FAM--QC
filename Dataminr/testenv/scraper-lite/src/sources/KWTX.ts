import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.kwtx.com';
const baseURLSuffix = '/news/local/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const link = $(el).find('h4 a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('h4 a').attr('href');
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
  const titleQuery = 'h1.headline';
  const articleFullTextQuery = '.article-body p.text:not(:has(i))';
  const title = fetchText(titleQuery, $, elements);
  const subTitle = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const todaysDate = moment().format('YYYY/MM/DD');
  const timestamp = moment(todaysDate, 'YYYY/MM/DD').unix();
  const articleInfo = `texas: ${title}; ${subTitle}`;
  const extraDataInfo = {
    title: `texas: ${title}`,
    subtitle: subTitle,
    articleFullText,
    date: `${todaysDate}`,
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

export const parser = new LiteParser('KWTX', baseURLPrefix, [
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
