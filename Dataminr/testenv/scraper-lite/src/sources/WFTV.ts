import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.wftv.com';
const baseURLSuffix = '/news/local/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.promo-headline a').attr('href');
    const headline = $(el).find('.promo-headline a').text().trim();
    if (!href.includes('/trending/') && !href.includes('/photos/') && !href.includes('/news/video')) {
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const date = $(elements).find('.hidden_sm time').attr('datetime')?.split('T')[0].trim();
  if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    const titleQuery = '.article-header-chain h1';
    const articleFullTextQuery = 'article > p';

    const title = fetchText(titleQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(date, 'YYYY-MM-DD').unix();
    const articleInfo = `${title}`;
    const extraDataInfo = {
      title,
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
  }
  return posts;
}

export const parser = new LiteParser(
  'WFTV',
  baseURLPrefix,
  [
    {
      selector: ['.top-table-list-section article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
