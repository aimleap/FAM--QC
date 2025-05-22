import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.wprost.pl/kraj';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 3; index++) {
    preThreads.push({
      link: `${baseURL}/${index}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) {
    return threads;
  }
  elements.forEach((el) => {
    moment.locale('pl');
    const newsDate = $(el).find('time.news-date span:not(span.dt)').text();
    if (moment(newsDate, 'DDMMMYYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.news-titlelead-wrapper a').attr('href');
      const headline = $(el).find('.news-titlelead-wrapper a').text();
      threads.push({
        link: href,
        title: `${headline}#${newsDate}`,
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

  if (url === (baseURL)) {
    return posts;
  }
  moment.locale('pl');
  const discussionTitleQuery = 'h1.art-title';
  const articleTextQuery = '.art-content';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = data[1].split('#')[1];
  const date = moment(dateText, 'DDMMMYYYY').format('MM/DD/YYYY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'DDMMMYYYY').unix();
  const newsInfo = `${articleText}`;
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

export const parser = new LiteParser('Wprost', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.left-column #main-list li.box-list-item-rwd-row'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
