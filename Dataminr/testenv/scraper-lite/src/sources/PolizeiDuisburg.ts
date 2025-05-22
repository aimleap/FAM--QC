import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://duisburg.polizei.nrw';
const baseURLSuffix = '/presse/pressemitteilungen';
moment.locale('de');
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.date-time').text();
    if (moment(articlePublishedDate, 'DD. MMMM YYYY | hh:mm a').isSame(moment(), 'day')) {
      const href = $(el).find('.field-title>a').attr('href');
      const description = $(el).find('.field-teaser').text().trim();
      threads.push({
        link: href,
        title: description,
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
  const titleQuery = '.field--name-field-base-short-title';
  const descriptionQuery = '.field--name-field-base-teaser-text';
  const dateQuery = '.datetime';
  const articleFullTextQuery = '.body-text-wrap';
  const date = fetchText(dateQuery, $, elements).trim().trim();
  if (!moment(date, 'DD. MMMM YYYY | hh:mm').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD. MMMM YYYY | hh:mm').unix();
  const articleInfo = `${title}; ${description}`;
  const extraDataInfo = {
    title,
    description,
    date,
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

export const parser = new LiteParser('Polizei Duisburg', baseURLPrefix, [
  {
    selector: ['.view-content .views-row'],
    parser: threadHandler,
  },
  {
    selector: ['.region-content article'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
