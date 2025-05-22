import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.rsipf.gov.sb';
const baseURLSuffix = '/?q=news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.event-date').text();
    const publishedDate = moment(date, 'MMM DD').format('MMMM DD, YYYY');
    if (moment(publishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('header a').attr('href');
      const headline = $(el).find('header a').text().trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1.title';
  const dateQuery = '.event-date';
  const locationQuery = '.event-place';
  const sectionQuery = '.event-content .field-name-body';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const formattedDate = moment(date, 'MMM DD').format('MMMM DD, YYYY');
  const location = fetchText(locationQuery, $, elements);
  const section = fetchText(sectionQuery, $, elements);
  const timestamp = moment(formattedDate, 'MMM DD, YYYY | hh:mm a').unix();
  const articleInfo = `Title: ${title} ; Location: ${location} ; Date: ${formattedDate} ; Section: ${section}`;
  const extraDataInfo = {
    title,
    date: formattedDate,
    location,
    section,
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

export const parser = new LiteParser('Royal Solomon Islands Police Force', baseURLPrefix, [
  {
    selector: ['#main .region.region-content .view-content article'],
    parser: threadHandler,
  },
  {
    selector: ['#main-content #main'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
