import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.thedubrovniktimes.com';
const baseUrlSuffix = '/news?limit=7&limitstart=0';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const articlePublishedDate = $el.find('.catItemDateCreated').text().trim();
    if (moment(articlePublishedDate, 'MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.catItemTitle a').attr('href');
      const headline = $el.find('.catItemTitle a').text().replace(/\n+/g, '').replace(/\t+/g, '');
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

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const discussionTitleQuery = 'h2.itemTitle';
  const dateQuery = '.itemDateCreated';
  const articleTextQuery = '.itemFullText';

  const dateText = fetchText(dateQuery, $, elements).trim();
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

export const parser = new LiteParser('The Dubrovnik Times', baseUrlPrefix, [
  {
    selector: ['.itemContainer'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
