import moment from 'moment';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.munhwa.com';
const baseURLSuffix = '/news/section_list.html?sec=all';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.info li:eq(1)').text().trim();
    if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
      const link = href.split('//www.munhwa.com')[1];
      const title = $(el).find('.title').text().replace(/\n+/g, ' ')
        .trim();
      threads.push({
        link,
        title,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const $ = cheerio.load(iconv.decode(response.body, 'EUC-KR').toString());
  const elements = $('body').get();
  const $el = $(elements);
  $el.find('p.art_img').remove();
  $el.find('.sub_title').remove();
  const titleQuery = '.view_title';
  const articleTextQuery = '.article.News_content';
  const dateQuery = '.date dd:eq(1)';
  const date = fetchText(dateQuery, $, elements).split('입력')[1].trim();
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD hh:mm').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
    date,
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

export const parser = new LiteParser(
  'Munhwa Ilbo',
  baseURLPrefix,
  [
    {
      selector: ['ul.news_list > li'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
  {
    encoding: 'binary',
  },
);
