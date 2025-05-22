import moment from 'moment';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://news.acotonou.com/';
moment.locale('fr');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.FontTextSousTitle').text().split('-')[2];
    if (moment(newsDate, 'DD MMM YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      threads.push({
        link: href,
        title: newsDate,
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
  if (url === baseURL) {
    return posts;
  }

  const $ = cheerio.load(iconv.decode(response.body, 'iso-8859-1').toString());
  const elements = $('body').get();
  const headlineQuery = 'h1.FontArticleMainTitle';
  const textQuery = '.FullArticleTexte';
  const headline = fetchText(headlineQuery, $, elements);
  const date = data[0];
  const text = fetchText(textQuery, $, elements);
  const timestamp = moment(date, 'DD MMM YYYY').unix();
  const textInfo = `${headline}`;
  const extraDataInfo = {
    Text: text,
    Date: date,
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
  'A Cotonou',
  baseURL,
  [
    {
      selector: ['.LiNews'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
