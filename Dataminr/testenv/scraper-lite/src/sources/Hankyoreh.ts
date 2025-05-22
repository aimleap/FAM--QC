import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.hani.co.kr';
const baseURLSuffix = '/arti/politics/defense/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('h4.article-title a').attr('href');
    const headline = $el.find('h4.article-title a').text().replace(/\n+/g, '').replace(/\t+/g, '')
      .trim();
    threads.push({
      link: href,
      title: `${headline}`,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const $el = $(elements);
  $el.find('.article-text .image-area').remove();
  const date = $el.find('.date-time span:contains(등록 :)').text().split('등록 :')[1].trim();
  if (moment(date, 'YYYY-MM-DD hh:mm').isSame(moment(), 'day')) {
    const titleQuery = 'h4 .title';
    const articleTextQuery = '.article-text .text';
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
  }
  return posts;
}

export const parser = new LiteParser(
  'Hankyoreh',
  baseURLPrefix,
  [
    {
      selector: ['.article-area'],
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
