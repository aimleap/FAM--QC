import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://sermitsiaq.ag/';

async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text().trim().replace(/\n+/g, '').replace(/\t+/g, '');
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
  if (url === baseURL) {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.find('article h1').text().trim().replace(/\n+/g, '')
      .replace(/\t+/g, '');
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
  if (url === baseURL) {
    return posts;
  }
  moment.locale('da');
  const $el = $(elements);
  const dateText = $el.find('.article-meta time').text();
  if (moment(dateText, 'dddd, DD. MMMM YYYY - h:mm').isSame(moment(), 'day')) {
    const titleQuery = '#content .header-content h1';
    const textQuery = '#content .body-content p,h3';

    const discussionTitle = fetchText(titleQuery, $, elements);
    const articleText = fetchText(textQuery, $, elements);
    const timestamp = moment(dateText, 'dddd, DD. MMMM YYYY - h:mm').unix();
    const newsInfo = `${articleText}`;
    const extraDataInfo = {
      discussion_title: discussionTitle,
      Date: `${dateText}`,
    };

    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('Kalaallit Nunaata Radioa', baseURL, [
  {
    selector: ['.menu .leaf a:contains(Indland), .menu .leaf a:contains(Nuuk), .menu .leaf a[href=/politi]'],
    parser: preThreadHandler,
  },
  {
    selector: ['.left .row .panel-pane a:not(.ga-top-news, .jobLink, a[href$=?page=1])'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
