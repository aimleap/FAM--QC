import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.glasgowtimes.co.uk';
const baseURLSuffix = '/news/scottish-news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('h3 a:eq(0) , h4 a:eq(0)').attr('href');
    const headline = $el.find('h3 a:eq(0) , h4 a:eq(0)').text();
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
  const dateText = $(elements).find('.content .mar-article time').attr('full-date');
  const date = moment(dateText, 'DD.MM.YYYY').format('MM/DD/YY');

  if (moment(dateText, 'DD.MM.YYYY').isSame(moment(), 'day')) {
    const titleQuery = '.content h1.mar-article__headline';
    const subTitleQuery = '.article-first-paragraph';
    const textQuery = '.article-body p';

    const text = fetchText(textQuery, $, elements);
    const subTitleText = fetchText(subTitleQuery, $, elements);
    const title = fetchText(titleQuery, $, elements);

    const timestamp = moment(date, 'MM/DD/YY').unix();
    const textInfo = `${subTitleText} ${text}`;
    const extraDataInfo = {
      discussion_title: title,
      Date: dateText,
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
  'Glasgow Times',
  baseURLPrefix,
  [
    {
      selector: ['.layout article'],
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
