import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.bradentonpd.com';
const baseURLSuffix = '/newsreleases';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.blog-meta-secondary time').text();
    if (moment(articlePublishedDate, 'MM/DD/YY').isSame(moment(), 'day')) {
      const href = $(el).find('h1.blog-title>a').attr('href');
      const title = $(el).find('h1.blog-title>a').text();
      threads.push({
        link: href,
        title,
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
  const titleQuery = 'h1.entry-title';
  const dateQuery = '.blog-item-content-wrapper .sqs-html-content p:eq(0)';
  const caseNumberQuery = '.blog-item-content-wrapper .sqs-html-content p:contains(Case #:)';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullTextQuery = `.blog-item-content-wrapper .sqs-html-content p:not(p:contains(Case #:), p:contains(${date}))`;
  const caseNumber = fetchText(caseNumberQuery, $, elements).replace('Case #:', '').trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${caseNumber} ; ${articleFullText}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
    'Case Number': caseNumber,
    Text: articleFullText,
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

export const parser = new LiteParser('City Of Bradenton Police Department', baseURLPrefix, [
  {
    selector: ['article.entry'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
