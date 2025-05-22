import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://apps.sacpd.org/Releases';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const newsDate = $(el).find('td:eq(2)').text();
    if (moment(newsDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('td:eq(0) a').attr('href');
      const headline = $(el).find('td:eq(1)').text().replace(/\n+/g, '')
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
  if (url === baseURL) return posts;
  const eventTypeQuery = '#nrTitle';
  const releaseNumberQuery = '#nrRefNum';
  const releaseDateQuery = '#nrDate';
  const textQuery = '#nrText';

  const eventTypeInfo = fetchText(eventTypeQuery, $, elements);
  let eventType = '';
  let location = '';
  if (eventTypeInfo.includes('-')) {
    eventType = eventTypeInfo?.split('-')[0];
    location = eventTypeInfo?.split('-')[1];
  } else {
    eventType = eventTypeInfo;
  }
  const releaseDate = fetchText(releaseDateQuery, $, elements);
  const releaseNumber = fetchText(releaseNumberQuery, $, elements);
  const articleFullText = fetchText(textQuery, $, elements);
  const timestamp = moment(releaseDate, 'dddd, MMMM DD, YYYY').unix();
  const pressReleasesInfo = `${releaseNumber} ; ${eventType} ; ${location} ; ${releaseDate} ; ${articleFullText}`;
  const extraDataInfo = {
    'Release Number': releaseNumber,
    'Event Type': eventType,
    Location: location,
    'Release Date': releaseDate,
    Text: articleFullText,
  };
  posts.push(
    new Post({
      text: pressReleasesInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Sacramento Police Department Releases', baseURL, [
  {
    selector: ['table.table-responsive-md tbody tr:not(:has(th))'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
