import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'http://www.hidomin.com';
const baseUrlSuffix = '/news/articleList.html?sc_multi_code=S1&view_type=sm';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let i = 1; i <= 12; i++) {
    preThreads.push({
      link: `${baseUrlPrefix}${baseUrlSuffix}&page=${i}`,
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) return threads;
  return elements.filter((el) => {
    const articlePublishedDate = $(el).find('.list-dated').text().split('|')[2].trim();
    return moment(articlePublishedDate, 'YYYY-MM-DD hh:mm').isSame(moment(), 'day');
  }).map((el) => ({
    link: $(el).find('.list-titles a').attr('href'),
    title: $(el).find('p.list-summary').text().replace(/\n+/g, ' ')
      .replace(/\t+/g, ' ')
      .trim(),
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) return posts;
  const titleQuery = '.article-head-title';
  const dateQuery = '.info-text ul li:eq(1)';
  const articleTextQuery = '#article-view-content-div';
  const dateText = fetchText(dateQuery, $, elements).replace('승인', '').trim();
  const date = moment(dateText, 'YYYY.MM.DD').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const description = data[1];
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY.MM.DD').unix();
  const newsInfo = `${title} ; ${description}`;
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

export const parser = new LiteParser('Gyeongbuk Peoples Ilbo', baseUrlPrefix, [
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
], baseUrlSuffix);
