import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const todayDate = moment().format('YYYY/MM/DD');
  elements.forEach((element) => {
    const $el = $(element);
    const href = $el.find('h2.entry-title>a').attr('href').trim();
    if (href.includes(todayDate)) {
      threads.push({
        link: $el.find('h2.entry-title>a').attr('href').trim(),
        title: `${moment(todayDate, 'YYYY/MM/DD').format('MM/DD/YYYY')}~${$el.find('h2.entry-title>a').text().trim()}`,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === 'https://xrebellion.at/blog-2/') {
    return posts;
  }
  const titleSelector = 'h1.entry-title';
  const bodySelector = '.et_pb_module.et_pb_post_content';
  const imageSelector = 'et_pb_module.et_pb_post_content figure img~data-src';
  const location = 'Austria';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrebellion.at/', location);
}

export const parser = new LiteParser('Extinction Rebellion Austria', 'https://xrebellion.at/blog-2/', [
  {
    selector: ['.et_pb_ajax_pagination_container article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
