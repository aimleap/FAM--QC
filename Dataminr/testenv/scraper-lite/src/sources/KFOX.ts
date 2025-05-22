import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://kfoxtv.com';
const baseURLSuffix = '/news/local';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('.headline a').attr('href');
    const headline = $el.find('.headline a').text();
    threads.push({
      link: href,
      title: headline,
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const $el = $(elements);
  const date = $el.find('div time').text().split(',')[1];
  if (moment(date, 'MMMM Do YYYY').isSame(moment(), 'day')) {
    const headlineQuery = '#js-Story-Headline-0 h1';
    const textQuery = '.StoryText-module_storyText__FWhP p:not(p:contains(RECOMMENDED), p:contains(Sign up to receive)), .StoryText-module_storyText__FWhP blockquote';
    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);
    const timestamp = moment(date, 'MMMM Do YYYY').unix();
    const textInfo = `${headline} `;
    const extraDataInfo = {
      Headline: headline,
      Text: text,
    };

    posts.push(
      new Post({
        text: textInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'KFOX',
  baseURLPrefix,
  [
    {
      selector: ['.StickyContainer li.teaserItem'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
