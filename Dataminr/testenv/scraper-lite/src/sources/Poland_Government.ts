import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.gov.pl';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.gov.pl/web/kwpsp-olsztyn/aktualnosci';
  const link2 = 'https://www.gov.pl/web/kppsp-staszow/aktualnosci';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'threads',
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
    const newsDate = $(el).find('.date').text().trim();
    if (moment(newsDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
      const headline = $(el).find('.title').text().trim();
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
  if (url === baseURL) {
    return posts;
  }

  const titleQuery = '.article-area__article h2';
  const responderQuery = 'h1.unit-h1';
  const descriptionQuery = '.intro';
  const dateQuery = '.event-date';
  const articleFullTextQuery = '.editor-content p';
  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'DD.MM.YYYY').format('MM/DD/YYYY');

  const title = fetchText(titleQuery, $, elements);
  const responder = fetchText(responderQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  let articleInfo = '';
  let extraDataInfo = {};
  if (url.includes('kppsp-staszow')) {
    articleInfo = `${responder}; ${title}; ${description}; ${date}`;
    extraDataInfo = {
      responder,
      title,
      description,
      date,
      articleFullText,
      ingestpurpose: 'mdsbackup',
    };
  } else {
    articleInfo = `${date}; ${responder}; ${title}`;
    extraDataInfo = {
      date,
      responder,
      title,
      articleFullText,
      ingestpurpose: 'mdsbackup',
    };
  }
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Poland Government', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.article-area__article ul li'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
