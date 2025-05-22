import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.noticel.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todayDate = moment().format('YYYYMMDD');
  elements.forEach((el) => {
    const link = $(el).attr('href');
    if (link.includes(todayDate)) {
      const href = $(el).attr('href');
      const headline = $(el).text();
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

  if (url === baseURL) {
    return posts;
  }
  const discussionTitleQuery = '.article__headline';
  const dateQuery = '.article-pubdate';
  const articleTextQuery = '.article-restofcontent>.article__body.main';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split(':')[1].trim();
  const date = moment(dateText, 'lll').format('MM/DD/YYYY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'lll').unix();
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

export const parser = new LiteParser('Noticel', baseURL, [
  {
    selector: ['article.section-teaser .entry-title a'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
