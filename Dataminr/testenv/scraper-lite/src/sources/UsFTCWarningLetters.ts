import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';
import { Post, Thread } from '../lib/types';

const baseURLPrefix = 'https://www.ftc.gov';
const baseURLSuffix = '/legal-library/browse/warning-letters';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishDate = $el.find('.field__item time').text().trim();
    if (moment(publishDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('h3.node-title a').attr('href');
      const headline = $el.find('h3.node-title a').text();
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
  const titleQuery = 'h1.margin-0';
  const dateQuery = '.main-content .region .node__content .field .field__items time';
  const tagsQuery = '.main-content .region .node__content .field--name-field-terms .field__items';

  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'dddd, MMMM D, YYYY').format('MM/DD/YYYY');
  const tags = fetchText(tagsQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const textInfo = `Title: ${title}, Date: ${date}, Tags: ${tags}`;

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
  'US FTC Warning Letters',
  baseURLPrefix,
  [
    {
      selector: ['.main .view-content .views-row .node__content'],
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
