import moment from 'moment';
import { Post, Thread } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.goerie.com';
const baseURLSuffix = '/news/';
async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text();
    preThreads.push({
      link: href,
      title: headline,
      parserName: 'thread',
    });
  });
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return threads;
  }
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.attr('href');
    if (link.includes(todaysDate)) {
      const href = $el.attr('href');
      const headline = $el.text().replace(/\n+/g, '').replace('For Subscribers', '').trim();
      threads.push({
        link: href,
        title: `${headline}#${moment(todaysDate, 'YYYY/MM/DD').format('MM/DD/YYYY')}`,
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
  const discussionTitleQuery = 'h1';
  const articleTextQuery = 'div p';

  let discussionTitle = fetchText(discussionTitleQuery, $, elements);
  if (discussionTitle === '') {
    discussionTitle = data[1]?.split('#')[0];
  }
  const dateText = data[1].split('#')[1];
  const date = moment(dateText, 'MM/DD/YYYY').format('MM/DD/YYYY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'MM/DD/YYYY').unix();
  const newsInfo = `${discussionTitle}; ${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: `${date}`,
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

export const parser = new LiteParser('GoErie', baseURLPrefix, [
  {
    selector: ['a:contains(Local),a:contains(Crime)'],
    parser: preThreadHandler,
  },
  {
    selector: ['a'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
