import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://kvia.com/category/news/el-paso/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const link = $(el).find('.story__title a').attr('href').trim();
    if (link.includes(todaysDate)) {
      const href = $(el).find('.story__title a').attr('href');
      const description = $(el).find('.story__excerpt').text().replace(/\n+/g, ' ')
        .trim();
      threads.push({
        link: href,
        title: description,
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
  if (url === baseURL) return posts;
  const titleQuery = '.entry__header';
  const articleFullTextQuery = '.entry__content p';
  const dateQuery = '.meta__published';
  const date = fetchText(dateQuery, $, elements).replace('Published', '').trim();
  const title = fetchText(titleQuery, $, elements);
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY hh:mm a').unix();
  const articleInfo = `${title} ; ${description}`;
  const extraDataInfo = {
    title,
    description,
    articleFullText,
    date,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('KVIA', baseURL, [
  {
    selector: ['#primary article'],
    parser: threadHandler,
  },
  {
    selector: ['#primary>article'],
    parser: postHandler,
    name: 'post',
  },
]);
