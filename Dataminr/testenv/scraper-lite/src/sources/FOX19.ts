import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const todaysDate = moment().format('YYYY/MM/DD');

const baseURLPrefix = 'https://www.fox19.com';
const baseURLSuffix = '/news/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('h4.headline a').attr('href');
    const headline = $(el).find('h4.headline').text().trim();
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

  if (url.includes(todaysDate)) {
    const titleQuery = 'h1.headline';
    const articleFullTextQuery = '.article-body .article-text';
    const title = fetchText(titleQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(todaysDate, 'YYYY/MM/DD').unix();
    const articleInfo = `${title}`;
    const extraDataInfo = {
      title,
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
  'FOX 19',
  baseURLPrefix,
  [
    {
      selector: ['.top-featured .card-deck .card , .middle-featured .card-deck .card , .middle-top .card-deck .card'],
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
