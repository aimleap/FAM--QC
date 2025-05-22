import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.srpd.org';
const baseURLSuffix = '/news.php';
const todaysDate = moment().format('MM/DD/YYYY');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).text();
    if (newsDate.includes(todaysDate)) {
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

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const titleQuery = '.subpage_container h3';
  const textQuery = '.subpage_container > div:eq(1)';
  const locationQuery = '.subpage_container .press-release-responsive em';
  const title = fetchText(titleQuery, $, elements);
  const location = fetchText(locationQuery, $, elements);
  const allText = fetchText(textQuery, $, elements);

  const timestamp = moment(todaysDate, 'MM/DD/YYYY').unix();
  const textInfo = `${title} ; ${todaysDate}`;
  const extraDataInfo = {
    location,
    allText,
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
  'San Rafael Police Department',
  baseURLPrefix,
  [
    {
      selector: ['.subpage_container div:not(.subpage_heading_blue, .generic_menu_reversed) p'],
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
