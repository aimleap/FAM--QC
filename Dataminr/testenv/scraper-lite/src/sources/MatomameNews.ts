import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    threads.push({
      link: href,
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

  const $el = $(elements);
  if (url === 'https://matomame.jp/cat/entertainment') {
    return posts;
  }
  moment.locale('ja');
  const dateString = $el.find('#article_detail > div > span').text();
  const date = moment(dateString, 'LL');
  if (date.isSame(moment(), 'day')) {
    const title = $el.find('#article_detail h1').text().replace(/\n+/g, '').trim();
    const description = $el.find('#article_detail p').text().replace(/\n+/g, '').trim();
    const timestamp = moment(date, 'LL').unix();
    const newsInfo = `Title: ${title}`;
    const additionalData = `Title: ${title}, Description: ${description}`;
    const extraDataInfo = { 'Additional Data': additionalData };
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

export const parser = new LiteParser(
  'Matomame News',
  'https://matomame.jp',
  [
    {
      selector: ['.article-box'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/cat/entertainment',
);
