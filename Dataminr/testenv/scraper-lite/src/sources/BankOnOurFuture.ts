import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://bankonourfuture.org';
const baseURLSuffix = '/all-news/news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.posted-on').text();
    if (moment(newsDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('.stretched-link').attr('href');
      const headline = $el.find('.post-title').text();
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const $el = $(elements);
  const headlineQuery = 'h1.text-green';
  const subHeadingQuery = '.text-large';
  const dateQuery = '.entry-date';
  const textQuery = '.container .row .col-md-12 ';

  const headline = fetchText(headlineQuery, $, elements);
  const subHeading = fetchText(subHeadingQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const formattedText = text.slice(0, 999);
  const image = $el.find('.container .post-thumbnail img').attr('src');

  const timestamp = moment(date, 'LL').unix();
  const textInfo = `${headline} ; ${subHeading} ; ${image} ; ${url} ; ${formattedText}`;
  const extraDataInfo = {
    Headline: headline,
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
  'Bank On Our Future',
  baseURLPrefix,
  [
    {
      selector: ['#main .row .card'],
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
