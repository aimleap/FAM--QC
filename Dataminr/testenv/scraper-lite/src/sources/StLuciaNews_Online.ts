import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.stlucianewsonline.com';
const baseURLSuffix = '/category/news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('.btArticleDate').text();
    if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.bt_bb_headline_content a').attr('href');
      const headline = $el.find('.bt_bb_headline_content a').text().replace(/\n+/g, '').trim();
      threads.push({
        link: href,
        title: `${headline}`,
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
  const titleQuery = '.btContent .bt_bb_headline_content';
  const textQuery = '.btArticleContent .bt_bb_wrapper p';
  const dateQuery = '.btContent .btArticleDate';

  const discussionTitle = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleText = fetchText(textQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: `${date}`,
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
  'St. Lucia News Online',
  baseURLPrefix,
  [
    {
      selector: ['.btContent article'],
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
