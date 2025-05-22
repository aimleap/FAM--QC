import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://police.birminghamal.gov/press-release-newsroom/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('p.small').text();
    if (moment(articlePublishedDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h3.post a').attr('href');
      const title = articlePublishedDate;
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const titleQuery = 'h3';
  const articleFullTextQuery = '.entry';
  const title = fetchText(titleQuery, $, elements);
  const date = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const pressReleasesInfo = `${title} ; ${date} ; ${articleFullText}`;
  const extraDataInfo = {
    title,
    date,
    articleFullText,
  };
  posts.push(
    new Post({
      text: pressReleasesInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Birmingham Police Department', baseURL, [
  {
    selector: ['#content #posts-wrapper div.post'],
    parser: threadHandler,
  },
  {
    selector: ['#content'],
    parser: postHandler,
    name: 'post',
  },
]);
