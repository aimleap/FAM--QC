import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.glasgowlive.co.uk';
const baseURLSuffix = '/news/glasgow-news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('a').text();
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
  const dateQuery = '.article-main .byline .article-information .time-info li:eq(0)';
  const dateText = fetchText(dateQuery, $, elements).split(',')[1].trim();
  const date = moment(dateText, 'DD MMM YYYY');

  if (moment(date, 'DD MMM YYYY').isSame(moment(), 'day')) {
    const titleQuery = '.article-main .headline-with-subtype h1.publication-font';
    const subTitleQuery = '.article-main .sub-title';
    const textQuery = '.article-main .article-wrapper .content-column .article-body p';

    const text = fetchText(textQuery, $, elements);
    const subTitleText = fetchText(subTitleQuery, $, elements);
    const title = fetchText(titleQuery, $, elements);

    const timestamp = moment(date, 'MM/DD/YY').unix();
    const textInfo = `${subTitleText} ${text}`;
    const extraDataInfo = {
      discussion_title: title,
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
  'Glasgow LIVE',
  baseURLPrefix,
  [
    {
      selector: ['.mod-pancakes .pancake.primary .teaser'],
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
