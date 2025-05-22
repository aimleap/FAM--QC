import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'http://www.hkcna.hk';
const baseURLSuffix = '/channel_pic.jsp?channel=4372';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('p').text();
    if (moment(articlePublishedDate, 'MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('h4 a').attr('href');
      const headline = $(el).find('h4 a').text().trim();
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
  const discussionTitleQuery = 'h4.xlTitle';
  const dateQuery = '.xlSub>span:eq(0)';
  const articleTextQuery = '.xlCon p';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY-MM-DD hh:mm').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm').unix();
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

export const parser = new LiteParser('Hong Kong China News Agency', baseURLPrefix, [
  {
    selector: ['ul.glList li'],
    parser: threadHandler,
  },
  {
    selector: ['.contentHt'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
