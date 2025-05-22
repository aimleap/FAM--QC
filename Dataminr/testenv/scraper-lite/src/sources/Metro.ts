import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://metro.co.uk/';
const baseURLSuffix = 'tag/london/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todayDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.attr('href');
    if (link.includes(todayDate)) {
      const href = $el.attr('href');
      const headline = $el.text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const discussionTitleQuery = 'h1.post-title';
  const dateQuery = '.post-date';
  const articleTextQuery = '.article-body p';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'dddd DD MMM YYYY h:mm a').format('MM/DD/YY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Metro', baseURLPrefix, [
  {
    selector: ['#tag-content h3>a'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
