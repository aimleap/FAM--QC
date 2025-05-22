import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { extractPosts, Selectors } from '../lib/sourceUtil';

const baseURLPrefix = 'https://ausrebellion.earth';
const baseURLSuffix = '/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const tempScriptTagText = $(elements).find('script[type=application/json]').get()[0].children[0].data;
  const jsonArray = JSON.parse(tempScriptTagText).props.pageProps.news.items;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.date).format('MM/DD/YYYY');
    if (moment(articlePublishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      /* eslint no-underscore-dangle: 0 */
      const href = jObj.__slug[0];
      const description = jObj.intro;
      threads.push({
        link: `${baseURLPrefix}${baseURLSuffix}${href}`,
        title: `${articlePublishedDate}~${description}`,
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
  const titleSelector = '.p-contain h1';
  const bodySelector = 'section.p-contain p';
  const imageSelector = 'img~src';
  const location = 'Australia';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(
    selectorList,
    elements,
    $,
    url,
    data,
    baseURLPrefix,
    location,
  );
}

export const parser = new LiteParser(
  'ER_Australia',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
