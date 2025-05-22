import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://emergency.vic.gov.au';
const baseURLSuffix = '/public/textonly.html';

const todaysDate = moment().format('MM/DD/YYYY');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    $(el).find('.lastUpdated').remove();
    const date = $(el).find('td:eq(3)').text().trim();
    if (date.includes('Today')) {
      const href = $(el).find('td a').attr('href');
      const headline = $(el).find('td a').text().trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  $(elements).find('table tbody tr .lastUpdated').remove();

  const typeQuery = 'table tbody tr td:eq(0)';
  const statusQuery = 'table tbody tr td:eq(1)';
  const locationQuery = 'table tbody tr td:eq(2)';
  const lastUpdatedQuery = 'table tbody tr td:eq(3)';
  const articleFullTextQuery = '.incidents > .container > div';
  const date = todaysDate;

  const type = fetchText(typeQuery, $, elements);
  const status = fetchText(statusQuery, $, elements);
  const location = fetchText(locationQuery, $, elements);
  const lastUpdated = fetchText(lastUpdatedQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const articleInfo = `${type}; ${location}`;
  const extraDataInfo = {
    type,
    status,
    location,
    lastUpdated,
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

export const parser = new LiteParser(
  'Vic Emergency',
  baseURLPrefix,
  [
    {
      selector: ['table tbody .feature-row'],
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
