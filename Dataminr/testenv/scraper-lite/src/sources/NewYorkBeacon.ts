import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp).unix();

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const linkText = $el.find('a').text();
    if (linkText.includes('Local') || linkText.includes('Color Culture')) {
      for (let i = 1; i < 3; i++) {
        const href = `${$el.find('a').attr('href')}page/${i}/`;
        const headline = $el.find('a').text();
        threads.push({
          link: href,
          title: headline,
          parserName: 'pages',
        });
      }
    }
  });
  return threads;
}

async function pageHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const yesterday = moment().subtract(1, 'day').format('LL');

  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('time.entry-date').text();
    if (date.includes(yesterday)) {
      const articleHref = $el.find('h3>a').attr('href');
      const headline = $el.find('h3>a').text();
      threads.push({
        link: articleHref,
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
  if (url === 'https://newyorkbeacon.com/') {
    return posts;
  }
  const articleTitle = $(elements).find('.entry-info>.entry-title').text().trim();
  const articlePublishedTime = $(elements).find('.entry-date>time').text().trim();
  const articleText = $(elements)
    .find(
      '.post_wrap>.entry-content>*:not(div.sharedaddy,div.clear,div:contains(Facebook Comments Box))',
    )
    .text()
    .replace(/\n+/g, '')
    .trim();
  const publishedDate = $(elements).find('.entry-date>time').attr('datetime');
  const timestamp = toUnixTimestamp(publishedDate);

  const articleInfo = `Title: ${articleTitle}, Published: ${articlePublishedTime}, Article Text: ${articleText}`;
  const extraDataInfo = {
    Article_Title: articleTitle,
    Date: articlePublishedTime,
    Article_Text: articleText,
  };

  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'New York Beacon',
  'https://newyorkbeacon.com/',
  [
    {
      selector: ['.main-menu .menu-main-container>ul>li'],
      parser: threadHandler,
    },
    {
      selector: ['.list-view article'],
      parser: pageHandler,
      name: 'pages',
    },
    {
      selector: ['#main>article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '',
  { strictSSL: false },
);
