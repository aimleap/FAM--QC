import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.franklintn.gov';
const baseURLSuffix = '/government/departments-k-z/police/franklin-pd-news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('p.item-date').text();
    if (moment(newsDate, 'MM/DD/YYYY hh:mm a').isSame(moment(), 'day')) {
      const href = $el.find('a.item-title').attr('href');
      const headline = $el.find('a.item-title').text();
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

  const headlineQuery = 'h2.detail-title';
  const dateQuery = '.detail-list-value';
  const descriptionQuery = 'h3.detail-subtitle';
  const textQuery = '.detail-content p';

  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MM/DD/YYYY hh:mm a').unix();
  const textInfo = `${headline} ; ${date} ; ${description}`;
  const extraDataInfo = {
    headline,
    date,
    description,
    text,
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
  'City of Franklin',
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
