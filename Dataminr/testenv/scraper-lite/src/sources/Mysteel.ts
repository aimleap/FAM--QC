import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.mysteel.net';
const baseURLSuffix = '/market-insights/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('p.date').text();
    if (moment(date, 'MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
      const headline = $(el).find('p.m-title').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1.article-title';
  const descriptionQuery = 'article.content';
  const publishedDateQuery = '.article-info .date';
  const sourceQuery = '.article-info .source';
  const publishedDate = fetchText(publishedDateQuery, $, elements).trim();
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const soucre = fetchText(sourceQuery, $, elements);
  const timestamp = moment(publishedDate, 'MMMM DD, YYYY').unix();
  const newsInfo = `${title}; ${soucre}; ${description}`;
  const extraDataInfo = {
    Title: title, Source: soucre, Description: description, Date: publishedDate,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Mysteel', baseURLPrefix, [
  {
    selector: ['.v-window__container ul.m-list li'],
    parser: threadHandler,
  },
  {
    selector: ['.main-content>.content-wrapper>.content'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
