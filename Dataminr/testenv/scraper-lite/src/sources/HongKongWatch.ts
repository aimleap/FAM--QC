import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    if (
      moment(
        $el.find('.summary-content .summary-metadata-container--below-title time').attr('datetime'),
        'YYYY-MM-DD',
      ).isSame(moment(), 'day')
    ) {
      threads.push({
        link: $el.find('.summary-content .summary-title a').attr('href'),
        title: $el.find('.summary-content .summary-title a').text(),
        parserName: 'post',
      });
    }
  });
  // If none of the post is present for the day fetching one latest post
  if (threads.length === 0) {
    threads.push({
      link: $(elements[0]).find('.summary-content .summary-title a').attr('href'),
      title: $(elements[0]).find('.summary-content .summary-title a').text(),
      parserName: 'post',
    });
  }
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
    const title = $el.find('h1').text().trim();
    const date = $el.find('.Blog-meta time').attr('datetime');
    const content = $el.find('.sqs-block-content').text().trim().substring(0, 1000);
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
  'HongKongWatch',
  'https://www.hongkongwatch.org/',
  [
    {
      selector: ['.summary-item'],
      parser: threadHandler,
    },
    {
      selector: ['article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/latest-news',
);
