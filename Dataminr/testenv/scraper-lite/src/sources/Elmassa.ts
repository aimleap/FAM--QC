import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.el-massa.com';
const baseURLSuffix = '/dz/%D8%A7%D9%84%D8%A3%D8%AE%D9%8A%D8%B1%D8%A9';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('.item-date time').attr('datetime');
    const textDate = date.split('+')[0];
    const formattedDate = `${textDate.split('T')[0]} ${textDate.split('T')[1]}`;
    if (moment(formattedDate, 'YYYY-MM-DD hh:mm:ss').isSame(moment(), 'day')) {
      const href = encodeURI($el.find('h3.item-title a').attr('href'));
      const headline = $el.find('h3.item-title').text().replace(/\n+/g, '').replace(/\t+/g, '')
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
  const headlineQuery = 'h3.item-title';
  const textQuery = '.itemIntroText p';

  const headline = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const date = $el.find('.item-date time').attr('datetime');
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
  'El - Massa',
  baseURLPrefix,
  [
    {
      selector: ['.item-list-row'],
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
