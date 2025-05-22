import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://borneobulletin.com.bn/category/national/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('time.entry-date').text();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h3 a').attr('href');
      const headline = $(el).find('h3 a').text().trim();
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
  if (url === baseURL) return [];
  const discussionTitleQuery = 'h1.tdb-title-text';
  const dateQuery = 'time.entry-date';
  const articleTextQuery = '.wpb_wrapper .td-post-content p';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'MMMM DD, YYYY').unix();
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

export const parser = new LiteParser('Borneo Bulletin', baseURL, [
  {
    selector: ['#tdi_92 .td-module-meta-info, #tdi_95 .td-module-meta-info, #tdi_96 .td-module-meta-info, #tdi_116 .td-module-meta-info'],
    parser: threadHandler,
  },
  {
    selector: ['.td-main-content-wrap'],
    parser: postHandler,
    name: 'post',
  },
]);
