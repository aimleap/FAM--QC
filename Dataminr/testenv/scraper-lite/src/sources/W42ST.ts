import moment from 'moment-timezone';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
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
  const $el = $(elements[0]);
  const title = $el.find('header h1').text().trim().replace(/\t+/g, '')
    .replace(/\t+/g, '');
  const datePosted = $el
    .find('header div div.entry-meta span.posted-on time.entry-date.published')
    .text()
    .trim()
    .replace(/\t+/g, '')
    .replace(/\t+/g, '');
  let articleText = '';
  $el.find('div.main-content div.entry-content p').each((index, data) => {
    articleText += $(data).text().trim().replace(/\t+/g, '')
      .replace(/\t+/g, '');
  });
  posts.push(
    new Post({
      text: `${title}; Published: ${datePosted}; ${articleText}`,
      postUrl: url,
      postedAt: moment(datePosted, 'MMMM DD[,] YYYY').unix(),
      extraData: { Article_Title: title, Date: datePosted, Article_Text: articleText },
    }),
  );
  return posts;
}

export const parser = new LiteParser('W42ST', 'http://w42st.com', [
  {
    selector: ['article div.entry-wrapper .entry-title a'],
    parser: threadHandler,
  },
  {
    selector: ['#main'],
    parser: postHandler,
    name: 'post',
  },
]);
