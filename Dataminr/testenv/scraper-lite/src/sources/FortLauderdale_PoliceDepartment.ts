import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.flpd.gov';
const baseURLSuffix = '/media/homepage-news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.item-date').text();
    if (moment(newsDate, 'MM/DD/YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = $el.find('.item-title').attr('href');
      const headline = $el.find('.item-title').text();
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

  const $el = $(elements);
  const headlineQuery = 'h2.detail-title';
  const textQuery = '.detail-content';

  const headline = fetchText(headlineQuery, $, elements);
  const dateText = $el.find('.detail-list-value').text();
  const date = $el.find('.detail-list-value').text().split(' ')[0];
  const time = `${$el.find('.detail-list-value').text().split(' ')[1]} ${$el.find('.detail-list-value').text().split(' ')[2]}`;
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(dateText, 'MM/DD/YYYY hh:mm a').unix();
  const textInfo = `${headline} ; ${date} ; ${time} `;
  const extraDataInfo = {
    Headline: headline,
    Date: date,
    Time: time,
    Text: text,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Fort Lauderdale Police Department',
  baseURLPrefix,
  [
    {
      selector: ['ul.list-main li'],
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
