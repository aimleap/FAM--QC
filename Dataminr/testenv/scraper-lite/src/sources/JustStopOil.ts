import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://juststopoil.org';
const baseURLSuffix = '/press/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const pressDate = $(el).find('.elementor-post__text .elementor-post-date').text();
    if (moment(pressDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('.elementor-post__text > a').attr('href');
      const headline = $el.find('.elementor-post__text h3.elementor-post__title').text();
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
  const headlineQuery = 'h1.entry-title';
  const dateQuery = '.ast-article-single .posted-on .published';
  const textQuery = '.site-content .ast-post-format- .entry-content';

  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const formattedText = text.slice(0, 999);
  const image = $el.find('.site-content .site-main .entry-header img').attr('src');

  const timestamp = moment(date, 'LL').unix();
  const textInfo = `${headline} ; ${image} ; ${url} ; ${formattedText}`;
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
  'Just Stop Oil',
  baseURLPrefix,
  [
    {
      selector: ['.entry-content .elementor-column article'],
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
