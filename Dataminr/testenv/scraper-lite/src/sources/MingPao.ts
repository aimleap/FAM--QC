import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://news.mingpao.com/';
const baseURLSuffix = 'ins/%E6%B8%AF%E8%81%9E/section/latest/s00001';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYYMMDD');
  elements.forEach((el) => {
    const href = $(el).attr('href').replace('../', '');
    if (href.includes(todaysDate)) {
      const headline = $(el).text().replace(/\n+/g, '').replace(/\t+/g, '')
        .trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  moment.locale('zh-hk');
  const discussionTitleQuery = 'h1';
  const articleTextQuery = 'article p';
  const dateQuery = '#articleTop .date';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY年MM月DD日dddd').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY年MM月DD日dddd').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
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

export const parser = new LiteParser('Ming Pao', baseURLPrefix, [
  {
    selector: ['#mainlist ul li>a'],
    parser: threadHandler,
  },
  {
    selector: ['#maincontent'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
