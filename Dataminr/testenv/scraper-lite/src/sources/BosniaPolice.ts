import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://granpol.gov.ba';
const baseUrlSuffix = '/Publication/Category/1?pageId=22';
async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const articlePublishedDate = $el.find('a p.date').text();
    if (moment(articlePublishedDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a p.date').text().trim();
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) return posts;

  const discussionTitleQuery = 'header>h1';
  const articleTextQuery = '.inner p';

  const dateText = data[0];
  const date = moment(dateText, 'DD.MM.YYYY.').format('MM/DD/YY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
  };

  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Bosnia Police',
  baseUrlPrefix,
  [
    {
      selector: ['article.body ul li'],
      parser: threadHandler,
    },
    {
      selector: ['article.body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
