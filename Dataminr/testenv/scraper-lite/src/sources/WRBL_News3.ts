import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.wrbl.com';
const baseURLSuffix = '/news/crime/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const newsDate = $(el).find('time').attr('datetime').split('T')[0].replace(/\n+/g, '');
    if (moment(newsDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.article-list__article-title a').attr('href');
      const headline = $(el).find('.article-list__article-title a').text().replace(/\t+/g, '')
        .replace(/\n+/g, '');
      threads.push({
        link: href,
        title: `${headline}`,
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
  const discussionTitleQuery = 'h1.article-title';
  const articleTextQuery = '.article-content.article-body';
  const dateQuery = '.article-info p:contains(Posted:) time';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split('/')[0].trim();
  const date = moment(dateText, 'MMM DD, YYYY').format('MM/DD/YYYY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `georgia: ${discussionTitle}`;
  const extraDataInfo = {
    articleText,
    ingestpurpose: 'mdsbackup',
  };

  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'WRBL News 3',
  baseURLPrefix,
  [
    {
      selector: ['#standard-layout article.article-list__article,#main>section.article-list article.article-list__article'],
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
