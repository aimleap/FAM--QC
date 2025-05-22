import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.kbtx.com';
const baseURLSuffix = '/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todayDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const hrefLink = $(el).find('h4.headline a').attr('href');
    if (hrefLink.includes(todayDate)) {
      const href = $(el).find('h4.headline a').attr('href');
      const subtitle = $(el).find('.deck').text().trim();
      threads.push({
        link: href,
        title: subtitle,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const titleQuery = 'h1.headline';
  const articleFullTextQuery = '.article-body p.article-text';
  const title = fetchText(titleQuery, $, elements);
  const subtitle = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const date = moment().format('MM/DD/YYYY');
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const articleInfo = `texas:${title}; ${subtitle}`;
  const extraDataInfo = {
    title,
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

export const parser = new LiteParser(
  'KBTX',
  baseURLPrefix,
  [
    {
      selector: ['.card-deck div.flex-feature .card-body'],
      parser: threadHandler,
    },
    {
      selector: ['.article-content-container'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
