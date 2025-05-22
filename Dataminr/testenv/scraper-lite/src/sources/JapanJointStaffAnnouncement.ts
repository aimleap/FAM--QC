import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

function getCurrentMonthAndYear() {
  const year = moment().year();
  const month = moment().format('MM');
  const monthAndYear = `${year}/${year}${month}`;
  return monthAndYear;
}

async function baseUrlHandler(): Promise<Thread[]> {
  const urlThreads: Thread[] = [];

  urlThreads.push({
    link: `https://www.mod.go.jp/js/tpl/Press/${getCurrentMonthAndYear()}.htm`,
    parserName: 'baseUrlThread',
  });

  return urlThreads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === 'https://www.mod.go.jp/js/index.htm') {
    return posts;
  }
  let i = 0;
  elements.forEach((el) => {
    const $el = $(el);
    const date = $('a')[i].childNodes[0].nodeValue.replace(/\n+/g, '').replace(/\s+/g, ' ').trim();
    if (moment(date, 'MM/DD').isSame(moment(), 'day')) {
      const title = $el.find('a').text();
      const timestamp = moment(date, 'MM/DD').unix();
      const announcementHeadline = `Title: ${title}`;
      posts.push(
        new Post({
          text: announcementHeadline,
          postUrl: url,
          postedAt: timestamp,
        }),
      );
    }
    i++;
  });

  return posts;
}

export const parser = new LiteParser(
  'Japan Joint Staff Announcement',
  'https://www.mod.go.jp/js/index.htm',
  [
    {
      selector: ['*'],
      parser: baseUrlHandler,
    },
    {
      selector: ['body ul li'],
      parser: postHandler,
      name: 'baseUrlThread',
    },
  ],
);
