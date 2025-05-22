import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.cbsnews.com';
const baseURLSuffix = '/minnesota/local-news/twin-cities/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('a').attr('href');
    const subtitle = $(el).find('.item__dek').text().trim();
    threads.push({
      link: href,
      title: subtitle,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const date = $(elements).find('p.content__meta--timestamp time').attr('datetime').split('T')[0].trim();
  if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    const titleQuery = 'h1.content__title';
    const articleFullTextQuery = 'article .content__body > p';

    const title = fetchText(titleQuery, $, elements);
    const subtitle = data[0];
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(date, 'YYYY-MM-DD').unix();
    const articleInfo = `${title}; ${subtitle}`;
    const extraDataInfo = {
      title,
      subtitle,
      articleFullText,
      ingestpurpose: 'mdsbackup',
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
  'CBS News',
  baseURLPrefix,
  [
    {
      selector: ['.component.list-river .component__item-wrapper .item'],
      parser: threadHandler,
    },
    {
      selector: ['.container'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
