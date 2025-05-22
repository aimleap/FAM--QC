import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'http://news.tvchosun.com/svc/news/ospc_news_all_list.html?catid=1';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.date').text().trim();
    if (moment(articlePublishedDate, 'YYYY.MM.DD hh:mm').isSame(moment(), 'day')) {
      const href = $(el).find('.article_tit a').attr('href');
      const description = $(el).find('.article').text().trim();
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
  if (url === baseURL) return [];
  const discussionTitleQuery = '.article_tit .title';
  const dateQuery = '.article_tit .date';
  const articleTextQuery = '.contents .article_detail_body';
  const dateText = fetchText(dateQuery, $, elements).split('/')[0].replace('등록', '').trim();
  const date = moment(dateText, 'YYYY.MM.DD hh:mm').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const description = data[0];
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY.MM.DD hh:mm').unix();
  const newsInfo = `${discussionTitle}, ${description}`;
  const extraDataInfo = {
    articleText,
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

export const parser = new LiteParser('TV Chosun', baseURL, [
  {
    selector: ['.contents ul li'],
    parser: threadHandler,
  },
  {
    selector: ['.container'],
    parser: postHandler,
    name: 'post',
  },
]);
