import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.fox13memphis.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.tnt-headline a').attr('href');
    const headline = $(el).find('.tnt-headline a').text().replace(/\n+/g, ' ')
      .trim();
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
  if (url === baseURL) return posts;
  const titleQuery = 'h1.headline';
  const dateQuery = '.visible-print';
  const articleFullTextQuery = '#article-body p';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  if (!moment(date, 'MMM DD, YYYY').isSame(moment(), 'day')) return posts;
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMM DD, YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser('FOX 13 Memphis', baseURL, [
  {
    selector: ['article.tnt-asset-type-article'],
    parser: threadHandler,
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
]);
