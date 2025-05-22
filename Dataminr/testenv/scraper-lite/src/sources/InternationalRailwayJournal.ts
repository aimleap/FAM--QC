import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.railjournal.com/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.ct-div-block:eq(1) .ct-text-block:not(a .ct-text-block) .ct-span:eq(0)').text();
    if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.ct-div-block:eq(1) a.ct-link').attr('href');
      const headline = $(el).find('.ct-headline').text();
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
  const titleQuery = 'article h1.ct-headline';
  const descriptionQuery = 'article h1.ct-headline+.ct-text-block';
  const publishedDateQuery = 'aside.ct-div-block h3+div>.ct-text-block';
  const articleTextQuery = 'article .ct-text-block.post-content';
  const publishedDate = fetchText(publishedDateQuery, $, elements).trim();
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(publishedDate, 'MMMM DD, YYYY').unix();
  const newsInfo = `${title}; ${description}; ${articleText}`;
  const extraDataInfo = {
    Title: title, Description: description, Text: articleText, Date: publishedDate,
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

export const parser = new LiteParser('International Railway Journal', baseURL, [
  {
    selector: ['.oxy-dynamic-list .ct-div-block .ct-new-columns'],
    parser: threadHandler,
  },
  {
    selector: ['.ct-new-columns'],
    parser: postHandler,
    name: 'post',
  },
]);
