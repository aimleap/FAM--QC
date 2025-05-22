import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.newagebd.net/articlelist/302/Bangladesh/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  let j = 0;
  for (let index = 1; index <= 5; index++) {
    preThreads.push({
      link: `${baseURL}${j}`,
      parserName: 'thread',
    });
    j += 10;
  }
  return preThreads;
}
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text().trim();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return [];
  const discussionTitleQuery = '.col-md-10 h3';
  const dateQuery = '.col-md-10 p';
  const articleTextQuery = 'article .postPageTest p~p';
  const dateText = fetchText(dateQuery, $, elements).split('|')[1].replace('Published:', '').trim();
  const date = moment(dateText, 'hh:mm, MMM DD,YYYY').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'hh:mm, MMM DD,YYYY').unix();
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

export const parser = new LiteParser('New Age Bangladesh', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['h3 a'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
