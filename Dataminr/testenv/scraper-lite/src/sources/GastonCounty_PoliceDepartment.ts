import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.gastongov.com';
const baseURLSuffix = '/CivicAlerts.aspx?CID=7';

const todaysDate = moment().format('MMMM DD, YYYY');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $(el).find('.date').text();
    if (date.includes(todaysDate)) {
      const href = $el.find('h3 a').attr('href');
      const description = $el.find('.intro p').text();
      threads.push({
        link: href,
        title: description,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const headlineQuery = '.item.fr-view h3';
  const textQuery = 'div.content p';

  const headline = fetchText(headlineQuery, $, elements);
  const description = data[0];
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(todaysDate, 'MMMM DD, YYYY').unix();
  const textInfo = `${headline} ; ${todaysDate} ; ${description}`;
  const extraDataInfo = {
    headline,
    todaysDate,
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
  'Gaston County Police Department',
  baseURLPrefix,
  [
    {
      selector: ['.listing .item'],
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
