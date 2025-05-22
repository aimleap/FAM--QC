import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { getThreadArray } from '../lib/parserUtil';

const moment = require('moment');

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp).unix();

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  return getThreadArray($, elements, url, 'h1', 'h1 a').map((t) => ({
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
  const rawTime = $el.find('.byline>.bylinedate').text();
  const publishedDate = rawTime !== '' ? moment(rawTime, 'LL') : '';
  if (publishedDate !== '') {
    if (moment(publishedDate).isAfter(yesterday)) {
      const articleTitle = $el.find('.post-header h1').text().trim();
      const articlePublishedTime = $el.find('.byline>.bylinedate').text().trim();
      const articleText = $el.find('.content-left>*:not(div)').text().replace(/\n+/g, '').trim();
      const timestamp = toUnixTimestamp(publishedDate);
      const articleInfo = `Title: ${articleTitle}, Published: ${articlePublishedTime}, Article Text: ${articleText}`;
      const extraDataInfo = {
        Article_Title: articleTitle,
        Date: articlePublishedTime,
        Article_Text: articleText,
      };

      posts.push(
        new Post({
          text: articleInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  }

  return posts;
}

export const parser = new LiteParser('Axios Charlotte', 'https://charlotte.axios.com/', [
  {
    selector: ['.content-left .entry-item'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
