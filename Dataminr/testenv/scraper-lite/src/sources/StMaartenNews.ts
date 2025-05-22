import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://stmaartennews.org/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const postDate = $el.find('time').text();
    if (moment(postDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h2>a').attr('href');
      const headline = $el.find('h2').text();
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
  const discussionTitleQuery = '.rst-post-block .rst-meta-info h1';
  const dateQuery = '.rst-post-block .rst-meta-info>.rst-inner-meta-info time';
  const articleTextQuery = '.rst-exceprt-post-single p';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split(',')[1].trim();
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
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

export const parser = new LiteParser('St Maarten News', baseURL, [
  {
    selector: ['article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
