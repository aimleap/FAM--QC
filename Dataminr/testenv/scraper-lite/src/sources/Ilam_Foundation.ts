import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://ilnews.online';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://ilnews.online/lang/arabic/';
  const link2 = 'https://ilnews.online/lang/english/';
  const link3 = 'https://ilnews.online/lang/french/';
  const link4 = 'https://ilnews.online/lang/german/';
  const link5 = 'https://ilnews.online/lang/es/';
  const link6 = 'https://ilnews.online/lang/indonesian/';
  const link7 = 'https://ilnews.online/lang/persian/';
  const link8 = 'https://ilnews.online/lang/urdu/';
  const link9 = 'https://ilnews.online/lang/russian/';
  const link10 = 'https://ilnews.online/lang/turkish/';
  const link11 = 'https://ilnews.online/lang/pashto/';
  const link12 = 'https://ilnews.online/lang/hindi/';
  const link13 = 'https://ilnews.online/lang/uzbek/';
  const link14 = 'https://ilnews.online/lang/bengali/';
  const link15 = 'https://ilnews.online/lang/amharic/';
  const link16 = 'https://ilnews.online/lang/somalia/';
  const link17 = 'https://ilnews.online/lang/kurdish/';
  const link18 = 'https://ilnews.online/lang/tajik/';
  const link19 = 'https://ilnews.online/lang/albanian/';
  const link20 = 'https://ilnews.online/lang/hausa/';
  const link21 = 'https://ilnews.online/lang/bos/';
  const link22 = 'https://ilnews.online/lang/malay/';
  const link23 = 'https://ilnews.online/lang/azer/';
  const link24 = 'https://ilnews.online/lang/dhivehi/';

  const urls = [link1, link2, link3, link4, link5, link6, link7, link8, link9, link10, link11, link12, link13, link14, link15, link16, link17, link18, link19, link20, link21, link22, link23, link24];
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
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.date').text().replace(/\n+/g, '')
      .replace(/\t+/g, ' ')
      .trim();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h2.post-title a').attr('href');
      const headline = $(el).find('h2.post-title a').text();
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
  if (url === baseURL) return [];
  const $el = $(elements);
  const titleQuery = 'h1.post-title';
  const dateQuery = '.entry-header .post-meta .date';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const article = $el.find('article .entry-content').attr('href');
  const articleText = article !== undefined ? `${baseURL}${article.trim()}` : '';
  const mediaText = $el.find('.entry-content ul li a').attr('href');
  const media = mediaText !== undefined ? `${baseURL}${mediaText.trim()}` : '';
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${date}; ${media}; ${url}; ${title}`;
  const extraDataInfo = {
    title,
    date,
    url,
    articleText,
    media,
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

export const parser = new LiteParser("I'lam Foundation", baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['ul li.post-item'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
