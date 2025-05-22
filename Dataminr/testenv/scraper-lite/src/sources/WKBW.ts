import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.wkbw.com/news/local-news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.ListItem-date').text();
    if (moment(articlePublishedDate, 'hh:mm a, MMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a.ListItem').attr('href');
      const headline = $(el).find('h3.ListItem-title').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
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
  if (url === baseURL) return posts;
  const titleQuery = 'h1.ArticlePage-headline';
  const dateQuery = '.published';
  const articleFullTextQuery = '.RichTextArticleBody-body p';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements).replace('Posted at', '').trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'hh:mm a, MMM DD, YYYY').unix();
  const articleInfo = `new_york: ${title}`;
  const extraDataInfo = {
    title: `new_york: ${title}`,
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

export const parser = new LiteParser('WKBW', baseURL, [
  {
    selector: ['ul.List-items li.List-items-row .List-items-row-item'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
