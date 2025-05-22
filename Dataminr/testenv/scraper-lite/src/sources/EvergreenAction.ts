import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.evergreenaction.com';
const baseURLSuffix = '/blog';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const blogDate = $(el).find('time').text();
    if (moment(blogDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('h2.blog-list-item-headline').text();
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

  const headlineQuery = 'h1.story-headline';
  const subHeadingQuery = 'h2.story-subheading';
  const dateQuery = '.story-meta-date';
  const textQuery = '.text-layer-wrap';

  const headline = fetchText(headlineQuery, $, elements);
  const subHeading = fetchText(subHeadingQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);
  const formattedText = text.slice(0, 999);
  const image = $el.find('.blog-hero img').attr('src');

  const timestamp = moment(date, 'dddd LL').unix();
  const textInfo = `${headline} ; ${subHeading} ; ${image} ; ${url} ; ${formattedText}`;
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
  'Evergreen Action',
  baseURLPrefix,
  [
    {
      selector: ['#main_content .blog-list .blog-list-item'],
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
