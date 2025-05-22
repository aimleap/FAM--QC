import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  const now = moment();
  const threeDaysAgo = moment().subtract(3, 'days');
  elements.forEach((x) => {
    const $element = $(x);
    const publishedDate = moment($element.find('article time').text(), 'LL');

    if (!publishedDate.isBetween(threeDaysAgo, now)) return;

    threads.push({
      link: $element.find('.node-title a').attr('href'),
      title: '',
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
  if (url === 'https://www.ftc.gov/news-events/press-releases?items_per_page=100') return [];

  const posts: Post[] = [];
  const $el = $(elements);

  const title = $el.find('h1.node-title').text().trim();
  const description = $el.find('.field--name-field-subtitle .field__item').text().trim();
  const date = moment($el.find('.field--type-datetime time').last().attr('datetime'));
  const source = 'US FTC';
  const additionalData = $el
    .find('.region-content article .node__content')
    .text()
    .replace(/\n+/g, '')
    .trim();

  const articleInfo = `Title: ${title}, Description: ${description}, Date: ${date.format(
    'MM/DD/YY',
  )}, Source: ${source}`;
  const extraDataInfo = {
    Title: title,
    Description: description,
    Date: date.format('MM/DD/YY'),
    Source: source,
    'Additional Data': additionalData,
  };

  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: date.unix(),
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'US FTC',
  'https://www.ftc.gov',
  [
    {
      selector: ['.region.region-content .view-content .views-row'],
      parser: threadHandler,
    },
    {
      selector: ['.dialog-off-canvas-main-canvas'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news-events/press-releases?items_per_page=100',
);
