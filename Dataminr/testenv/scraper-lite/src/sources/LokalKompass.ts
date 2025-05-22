import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.lokalkompass.de/oberhausen';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.article-card-meta .article-card-meta-date').text();
    if (moment(articlePublishedDate, 'DD.MM.YY').isSame(moment(), 'day')) {
      const href = $(el).find('h3.article-card-headline>a').attr('href');
      const location = $(el).find('.article-card-meta .article-card-meta-location').text().trim();
      threads.push({
        link: href,
        title: location,
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
  moment.locale('de');
  const titleQuery = 'h1';
  const dateQuery = '.article-meta>li';
  const articleFullTextQuery = '#content-main div[data-content-text]';
  $(elements).find('h1 .kicker').remove();
  const date = fetchText(dateQuery, $, elements);
  const title = fetchText(titleQuery, $, elements);
  const location = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD. MMMM YYYY, hh:mm a').unix();
  const articleInfo = `${title}; ${location}`;
  const extraDataInfo = {
    title,
    date,
    location,
    articleFullText,
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

export const parser = new LiteParser('Lokal Kompass', baseURL, [
  {
    selector: ['#content-main .article-list-item'],
    parser: threadHandler,
  },
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
]);
