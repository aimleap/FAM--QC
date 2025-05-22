import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://amap.ml';
const baseURLSuffix = '/?page_id=453';
moment.locale('fr');

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el)
      .find('.elementor-post-date')
      .text()
      .replace(/\n+/g, '')
      .replace(/\t+/g, '')
      .trim();
    if (moment(newsDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('h3.elementor-post__title a').attr('href');
      const headline = $el
        .find('h3.elementor-post__title')
        .text()
        .replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
      threads.push({
        link: href,
        title: `${newsDate}~${headline}`,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const headlineQuery = 'h1.entry-title';
  const textQuery = '.post-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const date = data[0].split('~')[0];
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'LL').unix();
  const textInfo = text;
  const extraDataInfo = {
    Headline: headline,
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
  'Amap',
  baseURLPrefix,
  [
    {
      selector: ['.elementor-posts-container article'],
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
    strictSSL: false,
  },
);
