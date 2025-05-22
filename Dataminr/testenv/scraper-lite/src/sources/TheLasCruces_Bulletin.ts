import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.lascrucesbulletin.com';
const baseURLSuffix = '/news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.dateline span[itemprop="datePublished"]').text();
    if (moment(newsDate, 'M/DD/YY').isSame(moment(), 'day')) {
      const href = $el.find('.headline a').attr('href');
      const description = $el.find('.lead').text().replace(/\n+/g, ' ').replace(/\t+/g, ' ')
        .trim();
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

  const headlineQuery = 'h1#headline';
  const dateQuery = '#published time';
  const textQuery = 'div.main-body';

  const headline = fetchText(headlineQuery, $, elements);
  const description = data[0];
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'dddd, MMMM DD, YYYY hh:mm a').unix();
  const textInfo = `${headline} ; ${description}`;
  const extraDataInfo = {
    headline,
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
  'The Las Cruces Bulletin',
  baseURLPrefix,
  [
    {
      selector: ['.story_list .item'],
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
