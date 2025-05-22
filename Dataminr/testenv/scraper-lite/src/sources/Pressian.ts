import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.pressian.com';
const todaysDate = moment().format('YYYYMMDD');

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.pressian.com/pages/nation-kw';
  const link2 = 'https://www.pressian.com/pages/nation-bu';
  const link3 = 'https://www.pressian.com/pages/nation-kn';
  const link4 = 'https://www.pressian.com/pages/nation-kj';
  const link5 = 'https://www.pressian.com/pages/nation-sc';
  const link6 = 'https://www.pressian.com/pages/nation-jb';
  const link7 = 'https://www.pressian.com/pages/nation-dk';
  const link8 = 'https://www.pressian.com/pages/nation-jj';
  const link9 = 'https://www.pressian.com/pages/nation-gg';
  const urls = [link1, link2, link3, link4, link5, link6, link7, link8, link9];
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
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const link = $(el).find('.title a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('.title a').attr('href');
      const title = $(el).find('.title a').text().replace(/\n+/g, ' ')
        .trim();
      threads.push({
        link: href,
        title,
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
  const titleQuery = '.view_header p.title';
  const dateQuery = '.byline .date';
  const articleTextQuery = '.article_body p';
  const dateText = fetchText(dateQuery, $, elements).replace('기사입력', '').trim();
  const date = moment(dateText, 'YYYY.MM.DD hh:mm:ss').format('MM/DD/YYYY hh:mm:ss');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm:ss').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
    date,
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

export const parser = new LiteParser('Pressian', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.arl_032 ul.list li, .arl_033 ul.list li'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
