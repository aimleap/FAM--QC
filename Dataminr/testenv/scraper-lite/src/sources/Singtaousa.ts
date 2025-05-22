import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const date = href.split('/')[3];
    if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const headline = $el.find('a').text();
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
  elements.forEach((el) => {
    const $el = $(el);
    const title = $el.find('.title-box h1').text().trim();
    const date = $el.find('.title-box .date-box time').attr('datetime');
    const content = $el
      .find('#content')
      .text()
      .trim()
      .substring(0, 1000)
      .trim()
      .replace(/\t+/g, '')
      .replace(/\n+/g, '');
    posts.push(
      new Post({
        text: `Headline: ${title}; Published: ${date}; Article URL: ${url}; Article Text: ${content}`,
        postUrl: url,
        postedAt: moment(date, 'YYYY-MM-DD').unix(),
        extraData: {
          Headline: title,
          Published: date,
          'Article URL': url,
          'Article Text': content,
        },
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'SIngTaousa',
  'https://www.singtaousa.com/',
  [
    {
      selector: ['.card'],
      parser: threadHandler,
    },
    {
      selector: ['article.content-article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/%e9%a6%99%e6%b8%af/C13#page3',
);
