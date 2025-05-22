import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://capitalnews.gw/';

moment.locale('pt');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.day-month').text();
    if (moment(newsDate, 'DD MMMM').isSame(moment(), 'day')) {
      const href = $el.find('.post-item-inner .post-details .more-link').attr('href');
      threads.push({
        link: href,
        title: newsDate,
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
  if (url === baseURL) {
    return posts;
  }
  const date = data[0];
  const headlineQuery = 'h1.post-title';
  const textQuery = '.entry-content p';

  const title = fetchText(headlineQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'DD MMMM').unix();
  const textInfo = `${text}`;
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
  return posts;
}

export const parser = new LiteParser('Capital News Guinea Bissau', baseURL, [
  {
    selector: ['.timeline-box .posts-items .post-item'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
