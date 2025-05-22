import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.thetelegraphandargus.co.uk';
const baseURLSuffix = '/news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const dateTime = $(el).find('.mar-lead-story__timestamp span, .timestamp span').attr('data-timestamp').trim();
    const articleDate:number = parseInt(dateTime, dateTime.length);
    const dateFormatted = new Date(articleDate * 1000).toLocaleString();
    const date = moment(dateFormatted, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY');
    if (moment(date, 'DD/MM/YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h3 a, h4 a').attr('href');
      const headline = $(el).find('h3 a, h4 a').text().trim();
      threads.push({
        link: href,
        title: `${date}~${headline}`,
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
  const titleQuery = 'h1.mar-article__headline';
  const articleFullTextQuery = '#subscription-content p';

  const title = fetchText(titleQuery, $, elements);
  const date = $el.find('.mar-article__timestamp time').attr('datetime');
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD hh:mm:ss').unix();
  const articleInfo = `bradford_uk: ${title}`;
  const extraDataInfo = {
    title,
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

export const parser = new LiteParser(
  'Telegraph and Argus',
  baseURLPrefix,
  [
    {
      selector: ['#articleListPageWrapper article'],
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
