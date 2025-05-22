import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.jcs.mil.kr/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.jcs.mil.kr/user/boardList.action?boardId=O_122047&siteId=jcs2&id=jcs2_040202000000';
  const link2 = 'https://www.jcs.mil.kr/user/boardList.action?boardId=O_121947&siteId=jcs2&id=jcs2_040201000000';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      title: urls[i],
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
    const articlePublishedDate = $(el).find('dd.info span:contains(합동참모본부)+span').text().trim();
    if (moment(articlePublishedDate, 'YYYY.MM.DD').isSame(moment(), 'day')) {
      const articleUrlPrefix = data[0];
      const onclickAttrValue = $(el).find('dl dt a').attr('onclick').split(',');
      const boardSeq = onclickAttrValue[2].replaceAll('\'', '');
      const formattedLink = `${articleUrlPrefix}&page=1&search=&column=&boardType=02&listType=&parent=&boardSeq=${boardSeq}&command=albumView&chkBoxSeq=&chkBoxId=&chkBoxPos=&chkBoxDepth=&chkBoxFamSeq=&warningYn=N&categoryId=&categoryDepth=`;
      const headline = $(el).find('dl dt').text().replace(/\n+/g, ' ')
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
  const titleQuery = '.dataview_detail dl dt';
  const dateQuery = '.prepare span:contains(작성일_) strong';
  const articleTextQuery = '.dataview_detail dl dd';
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

export const parser = new LiteParser('South Korea Joint Chief of Staff', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.board_newslist ul li'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['form'],
    parser: postHandler,
    name: 'post',
  },
]);
