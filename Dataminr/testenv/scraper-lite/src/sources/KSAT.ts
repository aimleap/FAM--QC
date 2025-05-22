import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.ksat.com';
const baseURLSuffix = '/news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const hrefLink = $(el).find('.storyText>.dist__StackBase-sc-1fnzlkn-5 span a').attr('href');
    if (hrefLink.includes(todaysDate)) {
      const href = $(el).find('.storyText>.dist__StackBase-sc-1fnzlkn-5 span a').attr('href');
      const headline = $(el).find('.storyText>.dist__StackBase-sc-1fnzlkn-5 span a').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = '.headline';
  const dateQuery = 'p:contains(Published:)';
  const articleFullTextQuery = '.articleBody';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements).replace('Published:', '').trim();
  if (!moment(date, 'MMMM DD, YYYY at hh:mm a').isSame(moment(), 'day')) return posts;
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY at hh:mm a').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date,
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

export const parser = new LiteParser('KSAT', baseURLPrefix, [
  {
    selector: ['article'],
    parser: threadHandler,
  },
  {
    selector: ['main'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
