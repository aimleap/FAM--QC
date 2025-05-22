import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.kgun9.com/border-watch';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.ListItem-date, .BigNews-time').text().trim();
    if (moment(articlePublishedDate, 'hh:mm a, MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a.BigNews-item, a.ListItem').attr('href');
      const title = $(el).find('h3.BigLittle-title, h3.ListItem-title').text();
      threads.push({
        link: href,
        title,
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
  if (url === baseURL) return [];
  const titleQuery = 'h1.ArticlePage-headline';
  const dateQuery = '.published';
  const articleTextQuery = '.ArticlePage-articleBody';
  $(elements).find('.accent').remove();
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'hh:mm a, MMM DD, YYYY').format('MM/DD/YYYY hh:mm a');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm a').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleText,
    Date: dateText,
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

export const parser = new LiteParser('KGUN 9 Border Watch', baseURL, [
  {
    selector: ['.BigNews-items>li.List-items-row, ul.List-items>li.List-items-row>div.List-items-row-item'],
    parser: threadHandler,
  },
  {
    selector: ['.ArticlePage-mainContent'],
    parser: postHandler,
    name: 'post',
  },
]);
