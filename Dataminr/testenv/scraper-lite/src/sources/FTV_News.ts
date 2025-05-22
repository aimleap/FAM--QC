import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.ftvnews.com.tw/realtime/';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.time').attr('data-time').split(' ')[0];
    if (moment(newsDate, 'YYYY/MM/DD').isSame(moment(), 'day')) {
      const href = `https://www.ftvnews.com.tw${$el.find('.content > a').attr('href')}`;
      const headline = $el.find('.content h2.title').text();
      const textInfo = `${headline} ; ${newsDate}`;
      const timestamp = moment(newsDate, 'YYYY/MM/DD').unix();
      posts.push(
        new Post({
          text: textInfo,
          postUrl: href,
          postedAt: timestamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'FTV News',
  baseURL,
  [
    {
      selector: ['ul#realtime > li'],
      parser: postHandler,
    },
  ],
);
