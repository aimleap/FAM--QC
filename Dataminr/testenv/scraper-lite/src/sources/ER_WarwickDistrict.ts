import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { extractPosts, Selectors } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://xrwd.earth';
const baseUrlSuffix = '/news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((element) => {
    const $el = $(element);
    const articlePublishedDate = $el.find('.published').text().trim();
    if (moment(articlePublishedDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      threads.push({
        link: $el.find('h2>a').attr('href').trim(),
        title: `${moment(articlePublishedDate, 'DD MMM YYYY').format('MM/DD/YYYY')}~${$el.find('h2').text().trim()}`,
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

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleSelector = 'title';
  const bodySelector = '.com-content-article__body';
  const imageSelector = 'img~src';
  const location = 'Warwick District';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrwd.earth', location);
}

export const parser = new LiteParser('Extinction Rebellion Warwick District', baseUrlPrefix, [
  {
    selector: ['.items-row .item'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
