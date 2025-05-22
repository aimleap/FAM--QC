import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.wfxg.com';
const baseURLSuffix = '/category/336494/crime';
const todaysDate = moment().format('YYYY/MM/DD');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.CardList-item-content a, .Card-content a').attr('href');
    const subtitle = $(el).find('.CardList-item-content a, .Card-content a').text().trim();
    threads.push({
      link: href,
      title: subtitle,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const time = $(elements).find('.BylineSocialNetwork .Timestamp-time').text().trim();
  if (time.includes('hrs ago') || time.includes('mins ago') || time.includes('min ago') || time.includes('secs ago')) {
    const titleQuery = 'h1.Article-title';
    const articleFullTextQuery = '.ArticleBody p';

    const title = fetchText(titleQuery, $, elements);
    const subtitle = data[0];
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(todaysDate, 'YYYY/MM/DD').unix();
    const articleInfo = `${title}; ${subtitle}`;
    const extraDataInfo = {
      title,
      subtitle,
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
  'WFXG',
  baseURLPrefix,
  [
    {
      selector: ['.CardList .CardList-item, .CardContainer .Card'],
      parser: threadHandler,
    },
    {
      selector: ['#page'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
