import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://news.ebc.net.tw/realtime';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.small-gray-text').text();
    if (moment(newsDate, 'MM/DD hh:mm').isSame(moment(), 'day')) {
      const href = `https://news.ebc.net.tw${$el.find('a').attr('href')}`;
      const headline = $el.find('.title').text();
      const textInfo = `${headline} ; ${newsDate}`;
      const timestamp = moment(newsDate, 'MM/DD hh:mm').unix();
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
  'ECB',
  baseURL,
  [
    {
      selector: ['.news-list-box .white-box'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
