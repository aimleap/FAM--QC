import crypto from 'node:crypto';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.cityofmadison.com';
const baseURLSuffix = '/fire/daily-reports';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const incidentLink = $(el).find('div:nth-child(1)>a').attr('href');
    const incident = $(el).find('div:nth-child(1)>a').text().trim();
    const date = $(el).find('div:nth-child(2)').text().replace('Date:', '')
      .trim();
    const incidentType = $(el).find('div:nth-child(3)').text().replace('Incident Type:', '')
      .trim();
    const address = $(el).find('div:nth-child(4)').text().replace('Address:', '')
      .trim();
    const updated = $(el).find('div:nth-child(5)').text().replace('Updated:', '')
      .trim();
    if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      threads.push({
        link: incidentLink,
        title: `${incident}#${date}#${incidentType}#${address}#${updated}`,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const dataInfo = data[0].split('#');
  const incident = dataInfo[0];
  const date = dataInfo[1];
  const incidentType = dataInfo[2];
  const address = dataInfo[3];
  const updated = dataInfo[4];
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const articleFullTextQuery = '.page--city-content .container-fluid>.row';
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const incidentInfo = `${incident}; ${address}`;
  const extraDataInfo = {
    incident,
    address,
    date,
    incidentType,
    updated,
    articleFullText,
    ingestpurpose: 'mdsbackup',
  };
  posts.push(
    new Post({
      text: incidentInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'City Of Madison, Wisconsin',
  baseURLPrefix,
  [
    {
      selector: ['.com-column-one div.row:not(.hidden-xs)'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
  {
    strictSSL: false,
    // @ts-ignore
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  },
);
