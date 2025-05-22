import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { getThreadArray } from '../lib/parserUtil';
import { parseTimestamp } from '../lib/timestampUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  return getThreadArray($, elements, url, 'figcaption a', 'figcaption a').map((t) => ({
    ...t,
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const $el = $(elements);
  const yesterday = moment().subtract(1, 'day');
  const rawTime = $el.find('section .content-header figcaption time').text();
  const timestamp = moment(rawTime, 'LL');

  if (moment(timestamp).isAfter(yesterday)) {
    const articleTitle = $el.find('section .content-header .heading-title').text();
    const articlePublishedTime = $el.find('section .content-header figcaption time').text();
    const articleText = $el
      .find('section .component-region.region-main-content .component-embed-html')
      .text()
      .replace(/\n+/g, '');
    const articleInfo = `Title: ${articleTitle}, Published: ${articlePublishedTime}, Article Text: ${articleText}`;
    const publishedTimestamp = parseTimestamp(articlePublishedTime);
    const extraDataInfo = {
      Article_Title: articleTitle,
      Date: articlePublishedTime,
      Article_Text: articleText,
    };

    posts.push(
      new Post({
        text: articleInfo,
        postUrl: url,
        postedAt: publishedTimestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  '1200 News Radio WOAI',
  'https://woai.iheart.com',
  [
    {
      selector: ['.feed-cards figure'],
      parser: threadHandler,
    },
    {
      selector: ['body main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/topic/Local%20News%20(119078)/',
);
