import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.erienewsnow.com';
const baseURLSuffix = '/category/205182/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('.CardList-item-content a').attr('href');
    const headline = $el.find('.CardList-item-content a').text();
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

  const $el = $(elements);
  $(elements).find('noscript').remove();
  $(elements).find('.Timestamp-updated').remove();
  const date = $el.find('.Timestamp .Timestamp-time:eq(0)').text().replace('EDT', '').trim();
  if (moment(date, 'dddd, MMMM Do YYYY, h:mm a').isSame(moment(), 'day')) {
    const headlineQuery = 'h1.Article-title';
    const textQuery = '.Article-contents .ArticleBody';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(date, 'dddd, MMMM Do YYYY, h:mm a').unix();
    const textInfo = `${text}`;
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
  }
  return posts;
}

export const parser = new LiteParser(
  'Erie News Now',
  baseURLPrefix,
  [
    {
      selector: ['.CardList .CardList-item-container'],
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
