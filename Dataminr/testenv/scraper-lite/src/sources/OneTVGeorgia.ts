import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://1tv.ge/lang/wp-json/witv/search/?search=&author=&searchFrom=&searchTo=&offset=0&posts_per_page=40&lang=en&post_type=news&topics=0&filter_show=0&filter_channel=0&special_topics=0';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const json = JSON.parse(response.body);
  const jsonArray = json.data.posts;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.post_date, 'YYYY-MM-DD');
    if (articlePublishedDate.isSame(moment(), 'day')) {
      const href = jObj.post_permalink;
      const headline = jObj.post_title;
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
  const discussionTitleQuery = '.article-title';
  const dateQuery = '.article-date';
  const articleTextQuery = '.article-intro';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'hh:mm DD.MM.YYYY').format('MM/DD/YY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'hh:mm DD.MM.YYYY').unix();
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

export const parser = new LiteParser('1TV Georgia', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
