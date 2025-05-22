import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.ajot.com';
const baseUrlSuffix = '/news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $el.find('.small').text().split('|')[1].trim();
    if (moment(newsDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h5.card-title a').attr('href');
      const headline = $el.find('h5.card-title').text().replace(/\n+/g, ' ').replace(/\t+/g, ' ')
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const $el = $(elements);
  const headlineQuery = 'article h1';
  const headline = fetchText(headlineQuery, $, elements);
  const postedBy = $el.find('.details.small').text().split('|')[0];
  const dateTime = $el.find('.details.small').text().split('|')[1];
  const date = dateTime.split('at')[0].trim();
  const time = dateTime.split('at')[1].trim();
  const description = $el.find('.article-text').text().replace(/\n+/g, ' ').replace(/\t+/g, ' ')
    .trim();
  const timestamp = moment(date, 'MMM DD YYYY').unix();
  const textInfo = `${headline} ; ${description}`;
  const extraDataInfo = {
    Title: headline,
    Description: description,
    Date: date,
    Time: time,
    'Posted By': postedBy,
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
  'American Journal Of Transportation',
  baseUrlPrefix,
  [
    {
      selector: ['.main-container .row .card'],
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
