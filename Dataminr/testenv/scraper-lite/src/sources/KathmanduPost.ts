import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://kathmandupost.com';
const baseUrlSuffix = '/valley';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text();
    if (href.includes(todaysDate)) {
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
  const discussionTitleQuery = '.container h1:not(.logo)';
  const articleTextQuery = '.story-section';
  const dateQuery = '.updated-time:contains(Published at)';
  const dateText = fetchText(dateQuery, $, elements).split(':')[1].trim();
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YYYY');
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

export const parser = new LiteParser('Kathmandu Post', baseUrlPrefix, [
  {
    selector: ['#mainContent .block--morenews article>a'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
