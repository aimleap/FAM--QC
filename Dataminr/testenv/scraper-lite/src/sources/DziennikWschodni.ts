import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.dziennikwschodni.pl/data.html';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 3; index++) {
    preThreads.push({
      link: `${baseURL}?p=/${index}`,
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
    const newsDate = $(el).find('td:eq(0)').text();
    if (moment(newsDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('td a.news-table__link').attr('href');
      const headline = $(el).find('td a.news-table__link').text().replace(/\n+/g, '')
        .trim();
      const date = $(el).find('td:eq(0)').text().replace(/\n+/g, '')
        .trim();
      threads.push({
        link: href,
        title: `${headline}#${date}`,
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
  const discussionTitleQuery = 'h1.single-news__title';
  const articleTextQuery = '.single-news__main-content .single-news__lead,.single-news__main-content .single-news__text-content p:not(p.news-lead__lead)';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = data[1].split('#')[1];
  const date = moment(dateText, 'DD.MM.YYYY').format('MM/DD/YYYY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'DD.MM.YYYY').unix();
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

export const parser = new LiteParser('Dziennik Wschodni', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.news-table>tbody>tr'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
