import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    threads.push({
      link: $el.attr('href').replace(/^.*\/\/[^/]+/, ''),
      title: $el.text(),
      parserName: 'prePostHandler',
    });
  });
  return threads;
}

async function prePostHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    threads.push({
      link: $el.attr('href').replace(/^.*\/\/[^/]+/, ''),
      title: $el.text(),
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
    try {
      const $el = $(el);
      const title = $el
        .find('header h1.entry-title')
        .text()
        .trim()
        .replace(/\t+/g, '')
        .replace(/\n+/g, '');
      const datePosted = $el
        .find('span.posted-on time.published')
        .text()
        .trim()
        .replace(/\t+/g, '')
        .replace(/\n+/g, '');
      const textContent = $el
        .find('.main-content div.entry-content')
        .text()
        .trim()
        .replace(/\t+/g, '')
        .replace(/\n+/g, '');
      posts.push(
        new Post({
          text: `${title}; Published: ${datePosted}; ${textContent}`,
          postUrl: url,
          postedAt: moment(datePosted, 'MMMM DD[,] YYYY').unix(),
          extraData: { Article_Title: title, Date: datePosted, Article_Text: textContent },
        }),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const parser = new LiteParser('San-Antonio', 'https://sanantonioreport.org/', [
  {
    selector: ['#menu-main-navigation-short-1 li a'],
    parser: threadHandler,
  },
  {
    selector: ['article.type-post .entry-title a'],
    parser: prePostHandler,
    name: 'prePostHandler',
  },
  {
    selector: ['#main'],
    parser: postHandler,
    name: 'post',
  },
]);
