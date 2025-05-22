import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://www.kyeonggi.com';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'http://www.kyeonggi.com/list/97'; // Community
  const link2 = 'http://www.kyeonggi.com/list/23'; // Incheon
  const link3 = 'http://www.kyeonggi.com/list/24'; // Politics
  const link4 = 'http://www.kyeonggi.com/list/25'; // economy
  const link5 = 'http://www.kyeonggi.com/list/26'; // society
  const link6 = 'http://www.kyeonggi.com/list/27'; // culture
  const urls = [link1, link2, link3, link4, link5, link6];
  for (let i = 0; i < urls.length; i++) {
    for (let j = 1; j < 3; j++) {
      preThreads.push({
        link: `${urls[i]}?page=${j}`,
        parserName: 'threads',
      });
    }
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
  return elements.filter((el) => {
    const articlePublishedDate = $(el).find('.news_tit span.byline span:eq(2)').text().trim();
    return moment(articlePublishedDate, 'YYYY-MM-DD hh:mm').isSame(moment(), 'day');
  }).map((el) => ({
    link: $(el).find('h3 a').attr('href'),
    title: $(el).find('h3 a').text(),
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return [];
  const titleQuery = '.article_tit_wrap h1.article_tit';
  const dateQuery = '.article_tit_wrap .article_date span:eq(1)';
  const articleTextQuery = '.article_cont_wrap p';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY-MM-DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
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

export const parser = new LiteParser('Gyeonggi Ilbo', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.article_list'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
