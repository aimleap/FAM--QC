import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text();
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

  if (url === 'https://www.js7tv.cn/') {
    return posts;
  }
  const today = moment();
  const twoDaysAgo = moment().subtract(2, 'days');

  const scriptTagText = $(elements).find('script[charset=utf-8]').get()[0].children[0].data;
  const modifiedText = scriptTagText.split('\'')[1];
  const jsonArray = JSON.parse(modifiedText);
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.datetime, 'YYYY-MM-DD');
    if (articlePublishedDate.isBetween(twoDaysAgo, today)) {
      const link = jObj.url;
      const { title } = jObj;
      const date = moment(jObj.datetime, 'YYYY-MM-DD').format('MM/DD/YYYY');
      const timestamp = moment(articlePublishedDate, 'MM/DD/YY').unix();
      posts.push(
        new Post({
          text: `Title: ${title}, Date: ${date}, Url: ${link}`,
          postUrl: url,
          postedAt: timestamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('China Military Vision Network', 'https://www.js7tv.cn/', [
  {
    selector: ['.main.resivion_nav>.nav_list.nav_list_2 li a:contains(要闻), .main.resivion_nav>.nav_list.nav_list_2 li a:contains(资讯), .main.resivion_nav>.nav_list.nav_list_2 li a:contains(武警), .main.resivion_nav>.nav_list.nav_list_2 li p a'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
