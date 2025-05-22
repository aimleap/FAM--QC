import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://addiszeybe.com';
const baseURLSuffix = '/category/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('.title-container').attr('href');
    const headline = $el.find('.title-container h3').text();
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
  const dateText = $el.find('.article-wrap .article-detail-date').text();
  if (moment(dateText, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
    const titleQuery = '.article-wrap .article-detail-head h1';
    const textQuery = '.article-wrap .article-content p';

    const discussionTitle = fetchText(titleQuery, $, elements);
    const articleText = fetchText(textQuery, $, elements);
    const timestamp = moment(dateText, 'MMMM DD, YYYY').unix();
    const newsInfo = `${articleText}`;
    const extraDataInfo = {
      discussion_title: discussionTitle,
      Date: `${dateText}`,
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
  'Addis Zeybe',
  baseURLPrefix,
  [
    {
      selector: ['.cat-list-container .news-card-content'],
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
