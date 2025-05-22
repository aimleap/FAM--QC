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
    const href = $el.find('a').attr('href').trim();
    if (href.includes(todayDate)) {
      threads.push({
        link: $el.find('a').attr('href').trim(),
        title: `${moment(todayDate, 'YYYY/MM/DD').format('MM/DD/YYYY')}~${$el.find('a').text().trim()}`,
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

  if (url === 'https://xrsl.earth/wp/') {
    return posts;
  }
  const titleSelector = 'h1.post__title';
  const bodySelector = '.type';
  const imageSelector = 'article.post figure img~src';
  const location = 'South Lakes';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrsl.earth/wp/', location);
}

export const parser = new LiteParser('Extinction Rebellion South Lakes', 'https://xrsl.earth/wp/', [
  {
    selector: ['.container>.type-body>ul>li'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
