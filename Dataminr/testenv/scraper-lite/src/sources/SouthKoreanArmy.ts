import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://www.army.mil.kr/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'http://www.army.mil.kr/webapp/user/indexSub.do?codyMenuSeq=213347&siteId=army';
  const link2 = 'http://www.army.mil.kr/webapp/user/indexSub.do?codyMenuSeq=213352&siteId=army';
  const link3 = 'http://www.army.mil.kr/webapp/user/indexSub.do?codyMenuSeq=20360841&siteId=army';
  const urls = [link1, link2, link3];
  for (let i = 0; i < urls.length; i++) {
    const codyMenuSeq = urls[i].split('codyMenuSeq=').pop()?.split('&')[0];
    preThreads.push({
      link: urls[i],
      title: codyMenuSeq,
      parserName: 'threads',
    });
  }
  return preThreads;
}
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('dl dd, td:eq(3)').text().trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const codyMenuSeq = data[0];
      let formattedLink = '';
      if (codyMenuSeq === '20360841') {
        const href = $(el).find('td.title a').attr('href');
        formattedLink = `http://www.army.mil.kr/webapp/user/${href}`;
      } else {
        const onclickAttrValue = $(el).find('dl dt a').attr('onclick').split(',');
        const boardId = onclickAttrValue[1].replaceAll('\'', '');
        const boardSeq = onclickAttrValue[2].replaceAll('\'', '');
        formattedLink = `http://www.army.mil.kr/webapp/user/indexSub.do?codyMenuSeq=${codyMenuSeq}&siteId=army&dum=dum&boardId=${boardId}&page=&command=albumView&boardSeq=${boardSeq}&chkBoxSeq=&categoryId=&categoryDepth=`;
      }
      const headline = $(el).find('dl dt, td.title a').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, '')
        .trim();
      threads.push({
        link: formattedLink,
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
  const titleQuery = 'dl.viewdata dt';
  const dateQuery = 'dt:contains(일 자)+dd, dt:contains(작성일)+dd';
  const articleTextQuery = 'dl.viewdata dd.contents';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YY.MM.DD hh:mm:ss').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YY.MM.DD hh:mm:ss').unix();
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

export const parser = new LiteParser('SouthKoreanArmy', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.list ul.gallery li, table tbody tr'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
