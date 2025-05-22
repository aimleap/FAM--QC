import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://mdta.maryland.gov';
const baseURLSuffix = '/news/MDTA_Police_News_Releases';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.node__submitted .field--name-created').text();
    if (moment(articlePublishedDate, 'ddd, MM/DD/YYYY - hh:mm').isSame(moment(), 'day')) {
      const href = $(el).find('h2 a').attr('href');
      const title = $(el).find('h2 a').text().trim();
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
  const titleQuery = '.page-title';
  const dateQuery = '.node__submitted .field--name-created';
  const locationQuery = 'p:not(p[align="center"]) b';
  const articleFullTextQuery = '.node__content p:not([style*=text-align:center])';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const location = fetchText(locationQuery, $, elements).split('(')[0].trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'ddd, MM/DD/YYYY - hh:mm').unix();
  const articleInfo = `${title} ; ${date} ; ${location} ; ${articleFullText}`;
  const extraDataInfo = {
    title,
    date,
    location,
    articleFullText,
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

export const parser = new LiteParser('Maryland Transportation Authority Police', baseURLPrefix, [
  {
    selector: ['.region-content .views-element-container .view-content .views-row article.node'],
    parser: threadHandler,
  },
  {
    selector: ['#page_content>main'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
