import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.mvariety.com';
const baseUrlSuffix = '/news/local/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('time').text();
    if (articlePublishedDate.includes('ago')) {
      const href = $(el).find('.tnt-headline a').attr('href');
      const headline = $(el).find('.tnt-headline a').text().trim();
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) return posts;
  const discussionTitleQuery = 'h1.headline';
  const articleTextQuery = '#article-body';
  const dateQuery = '.visible-print time.tnt-date';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MMM DD, YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
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

export const parser = new LiteParser('Marianas Variety', baseUrlPrefix, [
  {
    selector: ['.main-content .card-body'],
    parser: threadHandler,
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
