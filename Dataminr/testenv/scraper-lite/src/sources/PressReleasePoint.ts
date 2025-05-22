import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';
import { parseTimestamp } from '../lib/timestampUtil';

const baseUrlPrefix = 'https://www.pressreleasepoint.com';
const baseUrlSuffix = '/prpage/all';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 0; index < 2; index++) {
    preThreads.push({
      link: `${appendLink(baseUrlPrefix, baseUrlSuffix)}?page=${index}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return threads;
  }
  elements.forEach((el) => {
    const time = $(el).find('.views-field-picture').text();
    if (!time.includes('day') && !time.includes('week')) {
      const href = $(el).find('.views-field-title a').attr('href');
      const headline = $(el).find('.views-field-title a').text();
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const articleTitleQuery = 'h1.page-header';
  const publisherQuery = '.submitted>a';
  const articleDateQuery = '.submitted';
  const articleTextQuery = '.node-press-release, main>section';
  const articleTitle = fetchText(articleTitleQuery, $, elements);
  const publisher = fetchText(publisherQuery, $, elements);
  const dateText = $(elements)
    .find(`${articleDateQuery}`)
    .text()
    .split('on ')[1]
    .replace('-', '')
    .trim();
  const date = moment(dateText, 'DD/MM/YYYY hh:mm').format('MM/DD/YYYY hh:mm');
  $(elements).find('.submitted').remove();
  const articleFullText = fetchText(articleTextQuery, $, elements);
  const titleDescription = articleFullText.substring(0, 350);
  const articleText = articleFullText.substring(0, 2000);
  const timestamp = parseTimestamp(date);
  const newsInfo = `${date} - ${publisher} - ${articleTitle} , ${titleDescription}, ${articleText}`;
  const extraDataInfo = {
    'Article Date': date,
    Publisher: publisher,
    'Article Title': articleTitle,
    'Title Description': titleDescription,
    URL: url,
  };
  if (moment(date, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Press Release Point',
  baseUrlPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['div.view-content table.views-table>tbody>tr'],
      parser: threadHandler,
      name: 'thread',
    },
    {
      selector: ['.main-container .row>section'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
