import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://south24.net/news';
const baseURLSuffix = '/moree.php?mid=6';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.text h2 a').attr('href');
    const headline = $(el).find('.text h2').text();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
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
  const date = $el.find('.blog-post-item .date').text().split(',')[1].trim();
  if (moment(date, 'DD-MM-YYYY hh:mm a').isSame(moment(), 'day')) {
    const headlineQuery = '.content h1';
    const textQuery = 'div[style="direction: ltr;"]';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(date, 'DD-MM-YYYY hh:mm a').unix();
    const textInfo = `${text}`;
    const extraDataInfo = {
      discussion_title: headline,
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
  }
  return posts;
}

export const parser = new LiteParser(
  'South 24',
  baseURLPrefix,
  [
    {
      selector: ['.post-item'],
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
