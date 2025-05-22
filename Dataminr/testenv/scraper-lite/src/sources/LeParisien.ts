import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.leparisien.fr';
const todaysDate = moment().format('DD-MM-YYYY');

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.leparisien.fr/val-d-oise-95/';
  const link2 = 'https://www.leparisien.fr/oise-60/';
  const link3 = 'https://www.leparisien.fr/yvelines-78/';
  const link4 = 'https://www.leparisien.fr/seine-et-marne-77/';
  const link5 = 'https://www.leparisien.fr/hauts-de-seine-92/';
  const link6 = 'https://www.leparisien.fr/actualites-en-continu/';
  const urls = [link1, link2, link3, link4, link5, link6];
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
  if (url === baseURL) return threads;
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('a.lp-card-article__link').attr('href');
    if (link.includes(todaysDate)) {
      $el.find('a.lp-card-article__link span').remove();
      let href = '';
      if (url === 'https://www.leparisien.fr/actualites-en-continu/') {
        href = $el.find('a.lp-card-article__link').attr('href');
      } else {
        href = $el.find('a.lp-card-article__link').attr('href')?.split('//www.leparisien.fr')[1];
      }
      const headline = $el.find('a.lp-card-article__link').text();
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
  const headlineQuery = '.article_header h1';
  const textQuery = '.content p';

  const headline = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(todaysDate, 'DD-MM-YYYY').unix();
  const textInfo = `${headline}`;
  const extraDataInfo = {
    Headline: headline,
    Text: text,
    Date: todaysDate,
    ingestpurpose: 'mdsbackup',
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Le Parisien',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['li article'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
