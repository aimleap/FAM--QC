import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.demingheadlight.com';
const baseURLSuffix = '/category/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.date_part').text();
    if (moment(newsDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.title a').attr('href');
      const description = $el.find('.author, .body').text().replace(/\n+/g, ' ').replace(/\t+/g, ' ')
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

  const headlineQuery = 'div.title';
  const dateQuery = 'div.date';
  const textQuery = 'div.body';

  const headline = fetchText(headlineQuery, $, elements);
  const description = data[0];
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
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
  'Deaming Headlight',
  baseURLPrefix,
  [
    {
      selector: ['.template-content article'],
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
