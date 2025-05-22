import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.lancsfirerescue.org.uk';
const baseURLSuffix = '/information-hub/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.feed-item .text-wrap p:not(.rmore)').text();
    if (moment(date, 'DD/MM/YYYY hh:mm').isSameOrAfter(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
      const headline = $(el).find('.text-wrap h5').text().replace(/\n+/g, ' ')
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
  const $el = $(elements);
  const titleQuery = 'h1.entry-title';
  const articleFullTextQuery = '.entry-content';
  const title = fetchText(titleQuery, $, elements);
  const date = $el.find('.entry-content p:eq(0)').text()?.split(':')[1].trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD/MM/YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date,
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

export const parser = new LiteParser(
  'Lancashire Fire & Rescure Service',
  baseURLPrefix,
  [
    {
      selector: ['.feed-item'],
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
