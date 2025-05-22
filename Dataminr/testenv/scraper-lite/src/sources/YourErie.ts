import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.yourerie.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const newsDate = $(el).find('time').attr('datetime').split('T')[0].replace(/\n+/g, '');
    if (moment(newsDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.article-list__article-title a').attr('href');
      const headline = $(el).find('.article-list__article-title a').text().replace(/\t+/g, '')
        .replace(/\n+/g, '');
      threads.push({
        link: href,
        title: `${headline}#${newsDate}`,
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

  if (url === baseURL) {
    return posts;
  }
  const discussionTitleQuery = 'h1.article-title';
  const articleTextQuery = '.article-content.article-body';
  const dateQuery = '.article-info p:contains(Posted:) time';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split('/')[0].trim();
  const date = moment(dateText, 'MMM DD, YYYY').format('MM/DD/YYYY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMM DD, YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: `${date}`,
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

export const parser = new LiteParser('YourErie', baseURL, [
  {
    selector: ['#standard-layout article.article-list__article,#main>section.article-list article.article-list__article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
