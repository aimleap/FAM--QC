import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://kookbang.dema.mil.kr/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'ATCE_CTGR_0010000000';
  const link2 = 'ATCE_CTGR_0020000000';
  const link3 = 'ATCE_CTGR_0030000000';
  const urls = [link1, link2, link3];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: `https://kookbang.dema.mil.kr/newsWeb/menuList.do?parent_story_ty_id=${urls[i]}`,
      parserName: 'preThreadsTwo',
    });
  }
  return preThreads;
}

async function preThreadHandlerTwo(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const preThreadsTwo: Thread[] = [];
  if (url === baseURL) return preThreadsTwo;
  const jsonArray = JSON.parse(response.body).cateList;
  jsonArray.forEach((jObj: any) => {
    const storyTyIdPath = jObj.story_ty_id_path.replace(':', '').trim();
    const storyTyNmPath = jObj.story_ty_nm_path;
    if (!storyTyIdPath.includes(':')) {
      preThreadsTwo.push({
        link: `https://kookbang.dema.mil.kr/newsWeb/${storyTyIdPath}/list.do`,
        title: storyTyNmPath,
        parserName: 'threads',
      });
    }
  });
  return preThreadsTwo;
}
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.txt span').text().trim();
    if (moment(articlePublishedDate, 'YYYY.MM.DD hh:mm').isSame(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
      const title = $(el).find('.txt h3').text();
      threads.push({
        link: href,
        title: `${articlePublishedDate} ${title}`,
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
  const titleQuery = 'h2.article_title';
  const dateQuery = '.info div:contains(입력)';
  const articleTextQuery = '.article_body_main .article_body_view';
  $(elements).find('.btn_area').remove();
  const dateText = fetchText(dateQuery, $, elements).replace('입력', '').trim();
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

export const parser = new LiteParser('Kookbang Ilbo', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['*'],
    parser: preThreadHandlerTwo,
    name: 'preThreadsTwo',
  },
  {
    selector: ['.article_body_main ul.basic_list li'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['#container'],
    parser: postHandler,
    name: 'post',
  },
]);
