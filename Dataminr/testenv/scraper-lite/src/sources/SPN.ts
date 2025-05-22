import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.spnews.co.kr';
const baseURLSuffix = '/news/articleList.html?box_idxno=30&view_type=sm';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${appendLink(baseURLPrefix, baseURLSuffix)}&page=${index}`,
      parserName: 'thread',
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.byline em:eq(2)').text().trim();
    if (moment(articlePublishedDate, 'YYYY-MM-DD hh:mm').isSame(moment(), 'day')) {
      const href = $(el).find('h4.titles a').attr('href');
      const headline = $(el).find('h4.titles').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const titleQuery = 'h3.heading';
  const dateQuery = '.infomation li:contains(입력)';
  const articleTextQuery = 'article.article-veiw-body';
  const dateText = fetchText(dateQuery, $, elements).replace('입력', '').trim();
  if (dateText === '') return [];
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

export const parser = new LiteParser('SPN', baseURLPrefix, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['#section-list ul.type2 li'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
