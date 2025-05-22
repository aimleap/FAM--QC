import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.ennaharonline.com';
const baseURLSuffix = '/algeria/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('.card__mtft time').attr('datetime');
    const textDate = date.split('+')[0];
    const formattedDate = `${textDate.split('T')[0]} ${textDate.split('T')[1]}`;
    if (moment(formattedDate, 'YYYY-MM-DD hh:mm:ss').isSame(moment(), 'day')) {
      const href = $el.find('h2.card__title a').attr('href');
      const headline = $el.find('h2.card__title').text().replace(/\n+/g, '').replace(/\t+/g, '')
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const $el = $(elements);
  const headlineQuery = 'h1.sgb1__attl';
  const textQuery = '.sgb1__arwr .artx p';

  const headline = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = $el.find('.sgb1__mtgi time').attr('datetime');
  const textDate = date.split('+')[0];
  const formattedDate = `${textDate.split('T')[0]} ${textDate.split('T')[1]}`;

  const timestamp = moment(formattedDate, 'YYYY-MM-DD hh:mm:ss').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    Date: formattedDate,
    discussion_title: headline,
  };
  const decodedURL = decodeURI(url);

  posts.push(
    new Post({
      text: textInfo,
      postUrl: decodedURL,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Ennahar',
  baseURLPrefix,
  [
    {
      selector: ['.arvl article'],
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
