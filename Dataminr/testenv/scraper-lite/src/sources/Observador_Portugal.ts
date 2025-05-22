import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { fetchText } from '../lib/sourceUtil';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://observador.pt';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://observador.pt/seccao/sociedade/';
  const link2 = 'https://observador.pt/seccao/sociedade/crime/';
  const link3 = 'https://observador.pt/seccao/sociedade/seguranca/policia/';
  const urls = [link1, link2, link3];
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
    const $el = $(el);
    const href = $el.find('h1.title a').attr('href');
    const headline = $el.find('h1.title').text().replace(/\n+/g, '').replace(/\t+/g, ' ')
      .trim();
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
  moment.locale('pt');
  if (url === baseURL) {
    return posts;
  }

  const dateQuery = '.article-head .article-meta time';
  const date = fetchText(dateQuery, $, elements);
  if (moment(date, 'DD MMM YYYY, hh:mm').isSame(moment(), 'day')) {
    const headlineQuery = 'h1.article-head-content-headline-title';
    const textQuery = 'p.article-head-content-headline-lead, .article-body .article-body-content p:not(.title)';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(date, 'DD MMM YYYY, hh:mm').unix();
    const textInfo = `${text}`;
    const extraDataInfo = {
      Headline: headline,
      Date: date,
    };

    posts.push(
      new Post({
        text: textInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Obervador Portugal',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.editorial-grid .fbg-container .mod'],
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
