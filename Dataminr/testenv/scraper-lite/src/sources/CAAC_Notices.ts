import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'http://www.caac.gov.cn';
const baseURLSuffix = '/was5/web/search?page=1&channelid=211383&fl=9';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('zh-cn');
  elements.forEach((el) => {
    const $el = $(el);
    const publishDate = $el.find('.tdRQ').text().trim();
    if (moment(publishDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const titleQuery = '.content_t';
  const dateQuery = '.content_nav #lifwrq';
  const fullTextQuery = '.clearfix .content';
  const typeQuery = '.clearfix .content_nav_left.special';

  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).replace('发文日期：', '');
  const date = moment(dateText, 'YYYY-MM-DD').format('MM/DD/YYYY');
  const source = 'Civil Aviation Administration of China';
  const type = fetchText(typeQuery, $, elements).replace('主题分类：', '');
  const fullText = fetchText(fullTextQuery, $, elements);
  const additionalData = `${fullText}`;

  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const noticeReleaseInfo = `Title: ${title}, Date: ${date}, Source: ${source}, Type: ${type}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
  };

  posts.push(
    new Post({
      text: noticeReleaseInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );

  return posts;
}

export const parser = new LiteParser(
  'Civil Aviation Administration of China - Notices',
  baseURLPrefix,
  [
    {
      selector: ['.t_table tbody tr'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
