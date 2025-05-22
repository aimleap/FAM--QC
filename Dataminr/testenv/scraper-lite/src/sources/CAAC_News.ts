import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://www.caac.gov.cn/XWZX/';

async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href').replace('.', '');
    const headline = $el.find('a').text();
    threads.push({
      link: href,
      title: headline,
      parserName: 'threadHandler',
    });
  });
  return threads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const publishDate = $el.find('.n_date').text().trim();
    if (moment(publishDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      threads.push({
        link: href,
        title: publishDate,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) {
    return posts;
  }
  const titleQuery = '.content_t';
  const fullTextQuery = '.clearfix .content';

  const title = fetchText(titleQuery, $, elements);
  const dateText = data[1];
  const date = moment(dateText, 'YYYY-MM-DD').format('MM/DD/YYYY');
  const source = 'Civil Aviation Administration of China';
  const fullText = fetchText(fullTextQuery, $, elements);
  const additionalData = `${fullText}`;

  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const noticeReleaseInfo = `Title: ${title}, Date: ${date}, Source: ${source}, Additional Data: ${additionalData}`;
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
  'Civil Aviation Administration of China - Civil Aviation News',
  baseURL,
  [
    {
      selector: ['.n_tit:contains(地区动态),.n_tit:contains(行业动态),.n_tit:contains(民航要闻)'],
      parser: preThreadHandler,
    },
    {
      selector: ['body .clearfix .a_left .n_list li'],
      parser: threadHandler,
      name: 'threadHandler',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
