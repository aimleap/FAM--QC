import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.hhs.gov';
const baseUrlSuffix = '/about/news/index.html';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const updatedDate = $(el).find('.date-display-single').text();
    if (moment(updatedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a').text();
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function fetchText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  return $(elements).find(`${cssSelector}`).text().replace(/\n+/g, '')
    .replace(/\t+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

  const titleQuery = '.content h1';
  const descriptionQuery = '.content .paragraph em';
  const dateQuery = '.content .news-header time';
  const additionalDataQuery = '.content .paragraph';

  const title = await fetchText(titleQuery, $, elements);
  const description = await fetchText(descriptionQuery, $, elements);
  const dateText = await fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'LL').format('MM/DD/YY');
  const source = 'US HHS';
  const additionalData = await fetchText(additionalDataQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `Title: ${title}, Description: ${description}, Date: ${date}, Source: ${source}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );

  return posts;
}

export const parser = new LiteParser(
  'US HHS',
  baseUrlPrefix,
  [
    {
      selector: ['.views-row'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
