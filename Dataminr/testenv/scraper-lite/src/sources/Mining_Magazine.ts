import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.miningmagazine.com';
const baseURLSuffix = '/type/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.category-bottom span').text();
    if (moment(newsDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.list-content h2 a').attr('href');
      const headline = $el.find('.list-content h2').text();
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

  const headlineQuery = '.article-title h1';
  const subHeadingQuery = '.article-description p';
  const textQuery = '.article-content p';
  const dateQuery = '.publish-date ul li:not(.comments)';

  const headline = fetchText(headlineQuery, $, elements);
  const subHeading = fetchText(subHeadingQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);

  const timestamp = moment(date, 'DD MMMM YYYY').unix();
  const textInfo = `${headline} ; ${subHeading} ; ${text}`;
  const extraDataInfo = {
    Headline: headline,
    SubHeading: subHeading,
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
  'Mining Magazine',
  baseURLPrefix,
  [
    {
      selector: ['.listing-block .common-list'],
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
