import moment from 'moment';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'http://news.mt.co.kr';
const baseURLSuffix = '/newsList.html?pDepth1=politics&pDepth2=Ptotal';

const todaysDate = moment().format('YYYYMMDD');
moment.locale('ko');

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  return elements
    .filter((el) => $(el).find('.subject a').attr('href').includes(todaysDate))
    .map((el) => {
      const $el = $(el);
      const href = $el.find('.subject a').attr('href');
      const headline = $el.find('.subject a').text();
      return {
        link: href,
        title: headline,
        parserName: 'post',
      };
    });
}

async function postHandler(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];

  const $ = cheerio.load(iconv.decode(response.body, 'EUC-KR').toString());
  const elements = $('body').get();

  const $el = $(elements);
  $el.find('.article_photo').remove();
  $el.find('#textBody .util_box').remove();
  const titleQuery = 'h1.subject';
  const articleTextQuery = '.view_text #textBody';
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const date = $el.find('.date').text().trim();
  const timestamp = moment(date, 'YYYY.MM.DD hh:mm').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
  };

  return [
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  ];
}

export const parser = new LiteParser(
  'Money Today',
  baseURLPrefix,
  [
    {
      selector: ['.content ul li.bundle'],
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
