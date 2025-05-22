import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
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
  const $el = $(elements[0]);
  const title = $el.find('.pagetitle').text().trim().replace(/\t+/g, '')
    .replace(/\n+/g, '');
  let articleText = '';
  $el.find('.gc-content p').each((index, data) => {
    if (index !== 0) {
      articleText += $(data).text().trim().replace(/\t+/g, '')
        .replace(/\n+/g, '');
    }
  });
  posts.push(
    new Post({
      text: `${title}; ${articleText}`,
      postUrl: url,
      extraData: { Article_Title: title, Article_Text: articleText },
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'HarlemCommunity',
  'https://www.harlemcommunitynews.com/articles/',
  [
    {
      selector: ['.single-article-part h4 a'],
      parser: threadHandler,
    },
    {
      selector: ['body.post-template-default .subpagecontent-wrapper'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
