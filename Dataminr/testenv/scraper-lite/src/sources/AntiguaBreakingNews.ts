import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseUrl = 'https://antiguabreakingnews.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text();
    threads.push({
      link: href,
      title: `${headline}`,
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
  if (url === baseUrl) {
    return posts;
  }
  $(elements).find('noscript').remove();
  const discussionTitleQuery = 'h1.elementor-heading-title';
  const dateQuery = '.elementor-post-info__item--type-date';
  const articleTextQuery = '.elementor-widget-theme-post-content .elementor-widget-container p:not(p:has(a))';

  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'MMMM DD, YYYY').format('MM/DD/YY');
  if (!moment(date, 'MM/DD/YY').isSame(moment(), 'day')) return posts;

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Antigua Breaking News', baseUrl, [
  {
    selector: ['.pp-post-title a'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
