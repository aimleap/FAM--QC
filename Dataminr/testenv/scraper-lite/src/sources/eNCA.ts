import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.enca.com';
const baseURLSuffix = '/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('h1 a, h2 a').attr('href');
    const headline = $el.find('h1 a, h2 a').text();
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
  const dateText = $el.find('.node .node__submitted').text().split('-')[0].trim();
  if (moment(dateText, 'dddd DD MMMM YYYY').isSame(moment(), 'day')) {
    const titleQuery = 'h1.page-title';
    const textQuery = '.paragraph .text-formatted p';

    const discussionTitle = fetchText(titleQuery, $, elements);
    const articleText = fetchText(textQuery, $, elements);
    const timestamp = moment(dateText, 'dddd DD MMMM YYYY').unix();
    const newsInfo = `${discussionTitle}; ${articleText}`;
    const extraDataInfo = {
      discussion_title: discussionTitle,
      Date: `${dateText}`,
    };

    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'eNCA',
  baseURLPrefix,
  [
    {
      selector: ['.view .view-content .views-row:not(.views-row-odd, .views-row-even)'],
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
