import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.politie.be';
const baseURLSuffix = '/5388/nieuws';
moment.locale('nl');
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const publishedDate = $(el).find('time.datetime').text();
    if (moment(publishedDate, 'ddd DD.MM.YYYY - hh:mm').isSame(moment(), 'day')) {
      const href = $(el).find('a.read-more-link').attr('href');
      const headline = $(el).find('h2 .field--name-title').text();
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
  const titleQuery = 'h1 .field--name-title';
  const dateQuery = 'time.datetime';
  const descriptionQuery = '.field--name-field-intro';
  const articleFullTextQuery = '.layout--detail-node__main_content';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'dd DD.MM.YYYY - hh:mm').unix();
  const articleInfo = `Louvain: ${title}; ${date}; ${description}`;
  const extraDataInfo = {
    title,
    date,
    description,
    articleFullText,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser('Dutch National Police Leuven News', baseURLPrefix, [
  {
    selector: ['.region--content .views-element-container .view-content .item-list ul li'],
    parser: threadHandler,
  },
  {
    selector: ['article .layout.layout--detail-node'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
