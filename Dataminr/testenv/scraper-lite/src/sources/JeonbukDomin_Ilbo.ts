import moment from 'moment';
import { Post, Thread } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://www.domin.co.kr';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'http://www.domin.co.kr/news/articleList.html?sc_section_code=S1N6&view_type=sm'; // politics
  const link2 = 'http://www.domin.co.kr/news/articleList.html?sc_section_code=S1N7&view_type=sm'; // economy
  const link3 = 'http://www.domin.co.kr/news/articleList.html?sc_section_code=S1N8&view_type=sm'; // society
  const link4 = 'http://www.domin.co.kr/news/articleList.html?sc_section_code=S1N9&view_type=sm'; // culture
  const link5 = 'http://www.domin.co.kr/news/articleList.html?sc_section_code=S1N10&view_type=sm'; // education
  const link6 = 'http://www.domin.co.kr/news/articleList.html?sc_section_code=S1N1&view_type=sm'; // self-government
  const urls = [link1, link2, link3, link4, link5, link6];
  for (let i = 0; i < urls.length; i++) {
    for (let j = 1; j < 3; j++) {
      preThreads.push({
        link: `${urls[i]}&page=${j}`,
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
    const articlePublishedDate = $(el).find('div.list-dated').text().split('|')[2].trim();
    return moment(articlePublishedDate, 'YYYY-MM-DD hh:mm').isSame(moment(), 'day');
  }).map((el) => ({
    link: $(el).find('.list-titles a').attr('href'),
    title: $(el).find('.list-titles a').text(),
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
  const titleQuery = '.article-head-title';
  const dateQuery = '.info-text ul li:eq(1)';
  const articleTextQuery = '#article-view-content-div p';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY.MM.DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY.MM.DD hh:mm').unix();
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

export const parser = new LiteParser('Jeonbuk Domin Ilbo', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.article-list-content .list-block'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
