import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.thestandard.com.hk';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 3; index++) {
    preThreads.push({
      link: `https://www.thestandard.com.hk/ajax_sections_list.php?sid=4&d_str=&p=${index}&fc=&trending=0&gettype=section`,
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('span').text().trim();
    if (moment(articlePublishedDate, 'DD MMM YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = encodeURI($(el).find('h1>a').attr('href'));
      const headline = $(el).find('h1>a').text().trim();
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
  if (url === baseURL) return posts;
  const discussionTitleQuery = 'h1';
  const dateQuery = 'span.pull-left';
  const articleTextQuery = '.content p';
  const dateText = fetchText(dateQuery, $, elements).split('|')[1].trim();
  const date = moment(dateText, 'DD MMM YYYY hh:mm a').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'DD MMM YYYY hh:mm a').unix();
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

export const parser = new LiteParser('The Standard', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['li.caption'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['.ts-main'],
    parser: postHandler,
    name: 'post',
  },
]);
