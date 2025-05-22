import moment from 'moment';
import { Post, Thread } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.wbtv.com';
const baseURLSuffix = '/news/crime/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const link = $(el).find('.headline  a.text-reset').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('.headline  a.text-reset').attr('href');
      const headline = $(el).find('.deck').text();
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1';
  const dateQuery = '.published-date-time';
  const articleFullTextQuery = '.article-body p.text:not(:has(i))';
  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).replace('Published:', '').trim();
  const subTitle = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const date = moment(dateText, 'MMM DD, YYYY at hh:mm a EDT').format('MMM DD, YYYY hh:mm a');
  const timestamp = moment(dateText, 'MMM DD, YYYY hh:mm a').unix();
  const articleInfo = `north_carolina: ${title}; ${subTitle}`;
  const extraDataInfo = {
    title: `north_carolina: ${title}`,
    subtitle: subTitle,
    articleFullText,
    date,
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
  return posts;
}

export const parser = new LiteParser('WBTV', baseURLPrefix, [
  {
    selector: ['div.flex-feature '],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
