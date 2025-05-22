import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.rescue.ee';
const baseUrlSuffix = '/et/uudised/pressiteated';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('et');
  elements.forEach((el) => {
    const $el = $(el);
    const articlePublishedDate = $el.find('time').text();
    if (moment(articlePublishedDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a').text();
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
  moment.locale('et');
  const discussionTitleQuery = '.content>h1';
  const dateQuery = 'small>time';
  const articleTextQuery = '.componentized';

  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
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

export const parser = new LiteParser('Estonia Rescue Service', baseUrlPrefix, [
  {
    selector: ['.news-list .news-article'],
    parser: threadHandler,
  },
  {
    selector: ['#maincontent'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
