import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.tradewindsnews.com';
const baseURLSuffix = '/latest';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.published-at').text().split('Published')[1].trim();
    const formattedDate = moment(newsDate, 'D MMMM YYYY hh:mm').format('MM/DD/YYYY hh:mm');
    if (moment(formattedDate, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) {
      const href = $el.find('h2.teaser-title a').attr('href');
      const headline = $el.find('h2.teaser-title').text();
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

  const headlineQuery = 'h1.article-title';
  const subHeadingQuery = '.article-lead-text';
  const textQuery = '.article-body p';
  const dateQuery = '.article-center-column span.pr-3';

  const headline = fetchText(headlineQuery, $, elements);
  const subHeading = fetchText(subHeadingQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const formattedDate = moment(date, 'D MMMM YYYY hh:mm').format('MM/DD/YYYY hh:mm');
  const timestamp = moment(formattedDate, 'MM/DD/YYYY hh:mm').unix();
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
  'TradeWinds',
  baseURLPrefix,
  [
    {
      selector: ['.row .card-body'],
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
