import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://georgiatoday.ge';
const baseUrlSuffix = '/category/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('.jeg_postblock_content .jeg_meta_date').text();
    if (moment(newsDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('.jeg_postblock_content .jeg_post_title a').attr('href');
      const headline = $el.find('.jeg_postblock_content .jeg_post_title').text();
      threads.push({
        link: href,
        title: headline,
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
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }

  const headlineQuery = 'h1.jeg_post_title';
  const dateQuery = '.entry-header .jeg_meta_date';
  const textQuery = '.jeg_main_content .content-inner p';

  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'LL').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    discussion_title: headline,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Georgia Today',
  baseUrlPrefix,
  [
    {
      selector: ['.jeg_inner_content .jeg_post'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
