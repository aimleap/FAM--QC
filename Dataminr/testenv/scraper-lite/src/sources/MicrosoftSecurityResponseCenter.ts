import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://msrc.microsoft.com';
const baseURLSuffix = '/blog/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('p.text-body5').text();
    if (moment(articlePublishedDate, 'dddd, MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.text-heading3 a.link-heading').attr('href');
      const headline = $(el).find('.text-heading3').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1';
  const dateQuery = 'time';
  const articleFullTextQuery = '.blog-post-content';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const securityArticleInfo = `${title}; ${date}; ${articleFullText}`;
  const extraDataInfo = {
    title,
    date,
    description: articleFullText,
  };
  posts.push(
    new Post({
      text: securityArticleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Microsoft Security Response Center', baseURLPrefix, [
  {
    selector: ['.blog-postList article'],
    parser: threadHandler,
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
