import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    threads.push({
      link: $el.attr('href').replace(/^.*\/\/[^/]+/, ''),
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
  elements.forEach((el) => {
    const $el = $(el);
    const datePosted = moment($el.find('div.msg u').text().trim(), 'YYYY-MM-DD hh:mm:ss');
    if (!datePosted.isSame(moment(), 'day')) return;
    const title = $el.find('h6').text().trim();
    const content = $el.find('div.article-content').text().trim().substring(0, 1000);
    posts.push(
      new Post({
        text: `Text: ${title} ; URL: ${url}; Content: ${content
          .replace(/\t+/g, '')
          .replace(/\n+/g, '')}  Publication Date: ${datePosted.format('MM/DD/YYYY')};`,
        postUrl: url,
        postedAt: datePosted.unix(),
        extraData: {
          Text: title,
          URL: url,
          'Publication Date': datePosted.format('MM/DD/YYYY'),
        },
      }),
    );
  });

  return posts;
}

export const parser = new LiteParser(
  'HongKongCommercialDaily',
  'http://www.hkcd.com/',
  [
    {
      selector: ['body > div.content.main > div > div.new-list > div.new-list-content > a'],
      parser: threadHandler,
    },
    {
      selector: ['div.article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/hkcdweb/hongkongMacao.list.html',
);
