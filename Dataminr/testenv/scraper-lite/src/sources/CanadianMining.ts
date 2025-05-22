import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.canadianminingjournal.com/region/canada/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('h1 a, h3 a').attr('href');
    const headline = $(el).find('h1 a,h3 a').text();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
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
  const titleQuery = 'h1.single-title';
  const descriptionQuery = '.post-excerpt';
  const publishedDateQuery = '.post-meta';
  const articleTextQuery = '.single .container .post-inner-content';
  $(elements).find('.post-meta a').remove();
  const publishedDate = fetchText(publishedDateQuery, $, elements).replace('By', '').trim();
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(publishedDate, 'MMMM DD, YYYY at hh:mm a').unix();
  const newsInfo = `${title}; ${description}; ${articleText}`;
  const extraDataInfo = {
    Title: title, Description: description, Text: articleText, Date: publishedDate,
  };
  if (moment(publishedDate, 'MMMM DD, YYYY at hh:mm a').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('Canadian Mining', baseURL, [
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
