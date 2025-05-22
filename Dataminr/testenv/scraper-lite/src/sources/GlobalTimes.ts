import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.globaltimes.cn';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.globaltimes.cn/';
  const link2 = 'https://www.globaltimes.cn/index2.html';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return threads;
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text();
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
  const titleQuery = '.article_top .article_title';
  const descriptionQuery = '.post-excerpt';
  const publishedDateQuery = '.article_top .pub_time';
  const articleTextQuery = '.article_content ';
  const sectionQuery = '.article_top .article_column';
  $(elements).find('.picture').remove();
  let publishedDate = fetchText(publishedDateQuery, $, elements).trim();
  if (publishedDate.includes('Updated:')) {
    publishedDate = publishedDate.split('Updated:')[0].replace('Published:', '').trim();
  } else {
    publishedDate = publishedDate.replace('Published:', '').trim();
  }
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const section = fetchText(sectionQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(publishedDate, 'MMMM DD, YYYY at hh:mm a').unix();
  const newsInfo = `${title}; ${description}; ${articleText}`;
  const extraDataInfo = {
    Title: title, Description: description, Text: articleText, Date: publishedDate, Section: section,
  };
  if (moment(publishedDate, 'MMM DD, YYYY hh:mm a').isSame(moment(), 'day')) {
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

export const parser = new LiteParser('Global Times', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['#main_section01 a[class^=new_title], .common_section a[class^=new_title], #main_section02 a[class^=new_title]:not(a[href*=/galleries])'],
    parser: threadHandler,
    name: 'threads',

  },
  {
    selector: ['.article_page .article'],
    parser: postHandler,
    name: 'post',
  },
]);
