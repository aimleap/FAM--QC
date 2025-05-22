import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.nbcsandiego.com';
const baseURLSuffix = '/news/local/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.story-card__title-link').attr('href');
    const description = $(el).find('.story-card__excerpt').text().replace(/\n+/g, ' ')
      .replace(/\t+/g, ' ')
      .trim();
    threads.push({
      link: href,
      title: description,
      parserName: 'post',
    });
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const $el = $(elements);
  const date = $el.find('time.entry-date.published').attr('datetime')?.split('T')[0];
  if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    const titleQuery = 'h1.article-headline';
    const articleFullTextQuery = 'div.article-content p';
    const title = fetchText(titleQuery, $, elements);
    const description = data[0];
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(date, 'YYYY-MM-DD').unix();
    const articleInfo = `${title} ; ${description}`;
    const extraDataInfo = {
      title,
      description,
      articleFullText,
    };
    posts.push(
      new Post({
        text: articleInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'NBC San Diego',
  baseURLPrefix,
  [
    {
      selector: ['.article-content--wrap .story-card'],
      parser: threadHandler,
    },
    {
      selector: ['.site-main article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
