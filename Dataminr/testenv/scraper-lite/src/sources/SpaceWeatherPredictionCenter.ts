import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.swpc.noaa.gov';
const baseURLSuffix = '/products-and-data';

async function threadHandler(): Promise<Thread[]> {
  const tuple = [
    [
      'https://www.swpc.noaa.gov/products/space-weather-advisory-outlook',
      'https://services.swpc.noaa.gov/text/advisory-outlook.txt',
    ],
    [
      'https://www.swpc.noaa.gov/products/report-and-forecast-solar-and-geophysical-activity',
      'https://services.swpc.noaa.gov/text/sgarf.txt',
    ],
    [
      'https://www.swpc.noaa.gov/products/alerts-watches-and-warnings',
      'https://services.swpc.noaa.gov/products/alerts.json',
    ],
  ];
  return tuple.map(([title, link]) => ({
    title,
    link,
    parserName: 'post',
  }));
}

function extractAdvisoryOutlookPosts(
  $: CheerioSelector,
  elements: CheerioElement[],
  data: string[],
  articleTotalText: string,
): Post[] {
  const articleText = $(elements).text().split('#-')[1].replace(/--|\n/gm, '  ').trim();
  const date = articleTotalText.match(/Issued:(.*)UTC/);
  const timestamp = moment(date, 'YYYY MMM DD hhmm');
  const postLink = data[0];
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    Date: `${timestamp.format('YYYY-MM-DD')}`,
  };
  return [
    new Post({
      text: newsInfo,
      postUrl: postLink,
      postedAt: timestamp.unix(),
      extraData: extraDataInfo,
    }),
  ];
}

function extractReportAndForecastPosts(
  $: CheerioSelector,
  data: string[],
  articleTotalText: string,
): Post[] {
  const articleText = articleTotalText
    .substring(articleTotalText.indexOf('\nIA.') - 1)
    .replace(/\n/gm, '  ')
    .trim();
  const date = articleTotalText.match(/Issued:(.*)UTC/);
  const timestamp = moment(date![1].trim(), 'YYYY MMM DD hhmm');
  const postLink = data[0];
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    Date: `${timestamp.format('YYYY-MM-DD')}`,
  };
  return [
    new Post({
      text: newsInfo,
      postUrl: postLink,
      postedAt: timestamp.unix(),
      extraData: extraDataInfo,
    }),
  ];
}

function extractAlertsWatchesAndWarningsPosts(response: Response, data: string[]): Post[] {
  const jsonArray = JSON.parse(response.body);
  return jsonArray
    .map((jObj: any) => {
      const issueDate = jObj.issue_datetime.split(' ')[0];

      if (!moment(issueDate, 'YYYY-MM-DD').isSame(moment(), 'day')) return null;

      const articleText = jObj.message.replace(/\r\n/gm, '  ');
      const date = jObj.issue_datetime?.split(' ')[0];
      const timestamp = moment(date, 'YYYY-MM-DD').unix();
      const postLink = data[0];
      const newsInfo = `${articleText}`;
      const extraDataInfo = { Date: date };
      return new Post({
        text: newsInfo,
        postUrl: postLink,
        postedAt: timestamp,
        extraData: extraDataInfo,
      });
    })
    .filter((x: null) => x !== null);
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];

  const articleTotalText = $(elements).text();
  if (url.includes('advisory-outlook.txt')) return extractAdvisoryOutlookPosts($, elements, data, articleTotalText);
  if (url.includes('sgarf.txt')) return extractReportAndForecastPosts($, data, articleTotalText);

  return extractAlertsWatchesAndWarningsPosts(response, data);
}

export const parser = new LiteParser(
  'Space Weather Prediction Center',
  baseURLPrefix,
  [
    {
      selector: ['*'],
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
