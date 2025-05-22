import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.seatrade-maritime.com';
const baseURLSuffix = '/maritime-news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.date').text();
    if (moment(newsDate, 'MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.title a').attr('href');
      const headline = $el.find('.title').text();
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
  const headlineQuery = '.heading h1';
  const subHeadingQuery = '.field-name-field-penton-content-summary';
  const textQuery = '.article-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const subHeading = fetchText(subHeadingQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const authorDate = $el.find('.author-and-date').text();
  const author = authorDate.split('|')[0].trim();
  const date = authorDate.split('|')[1].trim();

  const timestamp = moment(date, 'MMM DD, YYYY').unix();
  const textInfo = `${headline} ; ${text}`;
  const extraDataInfo = {
    Headline: headline,
    SubHeading: subHeading,
    Author: author,
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
  'Seatrade Maritime',
  baseURLPrefix,
  [
    {
      selector: ['#main_content .region article:not(.usermarketing-promo-unit,.article-teaser__sponsored)'],
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
