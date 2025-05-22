import moment from 'moment';
import { Post, Thread } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://earthquake.phivolcs.dost.gov.ph/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('td:eq(0)').text();
    if (moment(articlePublishedDate, 'DD MMMM YYYY - hh:mm a').isSame(moment(), 'day')) {
      const href = $(el).find('td:eq(0) a').attr('href');
      const dateTime = $(el).find('td:eq(0)').text().replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
      const latitude = $(el).find('td:eq(1)').text().replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
      const longitude = $(el).find('td:eq(2)').text().replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
      const depth = $(el).find('td:eq(3)').text().replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
      const mag = $(el).find('td:eq(4)').text().replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
      const location = $(el).find('td:eq(5)').text().replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();
      const rowInfo = `${dateTime}#${latitude}#${longitude}#${depth}#${mag}#${location}`;
      threads.push({
        link: href,
        title: rowInfo,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const articleFullTextQuery = 'table.MsoNormalTable';
  const allInfo = data[0].split('#');
  const dateTime = allInfo[0].trim();
  const latitude = allInfo[1].trim();
  const longitude = allInfo[2].trim();
  const depth = allInfo[3].trim();
  const mag = allInfo[4].trim();
  const location = allInfo[5].trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateTime, 'DD MMMM YYYY - hh:mm a').unix();
  const articleInfo = `Magnitude  ${mag} earthquake detected ${location}`;
  const extraDataInfo = {
    Magnitude: mag,
    Location: location,
    'Date - Time': dateTime,
    latitude,
    longitude,
    depth,
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
  'Phivolcs',
  baseURL,
  [
    {
      selector: ['table.MsoNormalTable:nth-child(4) tbody tr:not(tr:has(th))'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '',
  {
    strictSSL: false,
  },
);
