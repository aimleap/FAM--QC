import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.mnd.go.kr/';
async function preThreadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const link1 = 'https://www.mnd.go.kr/cop/kookbang/kookbangIlboList.do?handle=dema0003&siteId=mnd&id=mnd_020108000000';
  const link2 = 'https://www.mnd.go.kr/user/boardList.action?boardId=I_26347&siteId=mnd&id=mnd_020107010000';
  const link3 = 'https://www.mnd.go.kr/cop/kookbang/kookbangIlboList.do?handle=dema0003&siteId=mnd&id=mnd_020106000000';
  const link4 = 'https://www.mnd.go.kr/cop/kookbang/kookbangIlboList.do?handle=dema0006&siteId=mnd&id=mnd_020104000000';
  const link5 = 'https://www.mnd.go.kr/cop/kookbang/kookbangIlboList.do?handle=dema0005&siteId=mnd&id=mnd_020103000000';
  const link6 = 'https://www.mnd.go.kr/cop/kookbang/kookbangIlboList.do?handle=dema0004&siteId=mnd&id=mnd_020102000000';
  const link7 = 'https://www.mnd.go.kr/cop/kookbang/kookbangIlboList.do?handle=dema0003&siteId=mnd&id=mnd_020101000000';
  const link8 = 'https://www.mnd.go.kr/user/newsInUserRecord.action?siteId=mnd&handle=I_669&id=mnd_020500000000';
  const urls = [link1, link2, link3, link4, link5, link6, link7, link8];
  for (let i = 0; i < urls.length; i++) {
    const id = urls[i].split('&id=')[1];
    threads.push({
      link: urls[i],
      title: id,
      parserName: 'threads',
    });
  }
  return threads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return threads;
  elements.forEach((el) => {
    const $el = $(el);
    const dateText = $el.find('dt:contains(작성일 :) + dd').text();
    const date = moment(dateText, ['YYYY.MM.DD', 'YYYY-MM-DD']).format('MM/DD/YYYY');
    const id = data[0];
    if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      let href = $el.find('.title a').attr('href');
      let link = href.split('\'');
      const demaID = link[1];
      let boardSeq = link[3];
      const headline = $el.find('.title a').text();
      let sourceUrl = '';
      if (id === 'mnd_020107010000') {
        const onclickAttrValue = $(el).find('.title a').attr('onclick').split(',');
        const boardId = onclickAttrValue[1].replaceAll('\'', '');
        boardSeq = onclickAttrValue[2].replaceAll('\'', '');
        sourceUrl = `https://www.mnd.go.kr/user/boardList.action?parent=&boardId=${boardId}&siteId=mnd&page=1&search=&column=&boardType=02&albumType=&listType=&id=${id}&boardSeq=${boardSeq}&command=albumView&chkBoxSeq=&chkBoxId=&chkBoxPos=&chkBoxDepth=&chkBoxFam_Seq=&warningYn=`;
      } else if (id === 'mnd_020500000000') {
        href = $el.find('.title a').attr('href');
        link = href.split('&');
        const newsID = link[1].split('=')[1];
        const newsSeq = link[2].split('=')[1];
        sourceUrl = `https://www.mnd.go.kr/user/newsInUserRecord.action?siteId=mnd&page=1&newsId=${newsID}&newsSeq=${newsSeq}&command=view&id=${id}&findStartDate=&findEndDate=&findType=title&findWord=&findOrganSeq=`;
      } else {
        sourceUrl = `https://www.mnd.go.kr/cop/kookbang/kookbangIlboView.do?siteId=mnd&pageIndex=1&findType=&findWord=&categoryCode=${demaID}&boardSeq=${boardSeq}&id=${id}`;
      }
      threads.push({
        link: sourceUrl,
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

  const $el = $(elements);
  const titleQuery = '.wrap_title .title';
  const textQuery = '.board_view .post_content';

  const title = fetchText(titleQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const dateText = $el.find('dt:contains(작성일 :) + dd').text();
  const date = moment(dateText, ['YYYY.MM.DD', 'YY.MM.DD hh:mm:ss', 'YYYY-MM-DD']).format('MM/DD/YYYY');

  const timestamp = moment(dateText, ['YYYY.MM.DD', 'YY.MM.DD hh:mm:ss', 'YYYY-MM-DD']).unix();
  const textInfo = title;
  const extraDataInfo = {
    text,
    date,
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
  'South Korea Ministry of National Defense',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['ul.list_post li'],
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
