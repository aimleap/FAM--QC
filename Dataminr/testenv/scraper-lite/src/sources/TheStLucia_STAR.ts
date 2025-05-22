import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://stluciastar.com';
const baseURLSuffix = '/category/local-news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('.entry-title a').attr('href');
    const headline = $el.find('.entry-title').text();
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
  const dateText = $el.find('.td-post-header .td-post-date time').text();
  if (moment(dateText, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
    const titleQuery = '.td-post-header h1.entry-title';
    const textQuery = '.td-post-content p';

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
  'The St. Lucia STAR',
  baseURLPrefix,
  [
    {
      selector: ['.td-category-grid .td-container .td-big-thumb, .td-category-grid .td-container .td-small-thumb, .td-main-content-wrap .td-container .td_module_wrap'],
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
