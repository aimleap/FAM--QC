import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.londonpolice.ca';
const baseURLSuffix = '/Modules/News/en';

const todaysDate = moment().format('MMMM DD, YYYY');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.blogPostDate').text();
    if (newsDate.includes(todaysDate)) {
      const href = $el.find('h2 a').attr('href');
      const headline = $el.find('h2 a').text();
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

  const headlineQuery = 'h1';
  const textQuery = '.iCreateDynaToken';

  const headline = fetchText(headlineQuery, $, elements);
  const location = 'London, ON';
  const date = todaysDate;
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(todaysDate, 'MMMM DD, YYYY').unix();
  const textInfo = `${headline} ; ${date} ; ${location} ; ${text}`;
  const extraDataInfo = {
    Headline: headline,
    Text: text,
    Date: date,
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
  'London Ontario Police Service',
  baseURLPrefix,
  [
    {
      selector: ['.blogItem'],
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
