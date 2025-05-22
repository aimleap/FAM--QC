import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.saba.ye';
const baseURLSuffix = '/ar';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text();
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
  const date = $el.find('.mainText time').attr('datetime').split('+')[0].trim();
  const formattedDate = moment(date, 'YYYY-MM-DDThh:mm:ss').format('MM/DD/YY hh:mm:ss');
  if (moment(formattedDate, 'MM/DD/YY hh:mm:ss').isSame(moment(), 'day')) {
    const headlineQuery = '.LastNewsText h1';
    const textQuery = 'div[itemprop="articleBody"]';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(formattedDate, 'MM/DD/YY hh:mm:ss').unix();
    const textInfo = `${text}`;
    const extraDataInfo = {
      Date: formattedDate,
      discussion_title: headline,
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
  'SabaNet',
  baseURLPrefix,
  [
    {
      selector: ['td > .LastNewsText[href^=\'/ar/news\']'],
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
