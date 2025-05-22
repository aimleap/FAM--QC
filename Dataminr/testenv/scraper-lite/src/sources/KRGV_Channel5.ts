import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.krgv.com';
const baseURLSuffix = '/local-news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.top-stories-text a, .long-title a').attr('href');
    const headline = $(el).find('.top-stories-text a, .long-title a').text().trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = '.title';
  const dateQuery = '.long-format.formatted-time';
  const articleFullTextQuery = '.article-content';
  const date = fetchText(dateQuery, $, elements);
  if (!moment(date, 'MMMM DD, YYYY hh:mm a').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY hh:mm a').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('KRGV Channel 5', baseURLPrefix, [
  {
    selector: ['.top-stories article, .image-grid-items-container article'],
    parser: threadHandler,
  },
  {
    selector: ['article.news-article'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
