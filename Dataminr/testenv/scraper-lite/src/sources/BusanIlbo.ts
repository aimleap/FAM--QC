import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.busan.com/';
const todaysDate = moment().format('YYYYMMDD');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const link = $(el).find('.title a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('.title a').attr('href');
      const title = $(el).find('.title a').text().replace(/\n+/g, ' ')
        .trim();
      threads.push({
        link: href,
        title,
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
  const titleQuery = '.article_head p.title';
  const dateQuery = '.article_view .article_head .byline';
  const articleTextQuery = '.section .article_view .article_content > p:not(.subtitle)';
  const dateText = fetchText(dateQuery, $, elements).replace('입력 :', '').trim();
  const date = moment(dateText, 'YYYY-MM-DD hh:mm:ss').format('MM/DD/YYYY hh:mm:ss');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm:ss').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
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

export const parser = new LiteParser('Busan Ilbo', baseURL, [
  {
    selector: ['.hdl_001 .wcms_outline li, .arl_001 .wcms_outline li'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
