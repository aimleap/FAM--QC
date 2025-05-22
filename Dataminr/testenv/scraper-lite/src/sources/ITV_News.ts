import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.itv.com';
const baseURLSuffix = '/news/granada';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.itv.com/news/granada';
  const link2 = 'https://www.itv.com/news/westcountry';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('a').text();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
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
  const dateQuery = '.cp_app-wrapper .cp_grid li time';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'dddd DD MMM YYYY, h:mm a').format('MM/DD/YY');

  if (moment(dateText, 'dddd DD MMM YYYY, h:mm a').isSame(moment(), 'day')) {
    const titleQuery = 'h1.cp_heading';
    const textQuery = '.cp_app-wrapper .cp_grid .cp_grid__item .B3cPr .cp_paragraph';

    const text = fetchText(textQuery, $, elements);
    const title = fetchText(titleQuery, $, elements);

    const timestamp = moment(date, 'MM/DD/YY').unix();
    const textInfo = `Text: ${text}`;
    const extraDataInfo = {
      discussion_title: title,
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
  }
  return posts;
}

export const parser = new LiteParser(
  'ITV News',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.cp_app-wrapper .cp_grid article'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
