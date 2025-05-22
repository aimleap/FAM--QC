import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.sarniapolice.ca';
const baseURLSuffix = '/category/daily-media-releases/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.elementor-post-date').text().trim()
      .replace(/\n+/g, '')
      .replace(/\t+/g, '');
    if (moment(newsDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h3.elementor-post__title a').attr('href');
      const headline = $el.find('h3.elementor-post__title').text().replace(/\n+/g, '').replace(/\t+/g, '');
      threads.push({
        link: href,
        title: `${headline}~${newsDate}`,
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

  const headlineQuery = 'div h1.elementor-heading-title';
  const textQuery = '.elementor-widget-theme-post-content .elementor-widget-container p';

  const headline = fetchText(headlineQuery, $, elements);
  const date = data[0].split('~')[1].trim();
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const textInfo = `${headline} ; ${date} ; ${text}`;

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Sarnia Police',
  baseURLPrefix,
  [
    {
      selector: ['.elementor-posts article'],
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
