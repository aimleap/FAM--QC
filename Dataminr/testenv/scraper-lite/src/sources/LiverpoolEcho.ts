import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.liverpoolecho.co.uk/';
const baseURLSuffix = 'news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text();
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
  const discussionTitleQuery = 'h1';
  const subHeadlineQuery = '.sub-title';
  const dateQuery = 'ul.time-info>li:eq(0)';
  const articleTextQuery = '.article-body p';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const subHeadline = fetchText(subHeadlineQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split(',')[1].trim();
  const date = moment(dateText, 'DD MMM YYYY').format('MM/DD/YY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${subHeadline}; ${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
  };
  if (moment(dateText, 'DD MMM YYYY').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('Liverpool Echo', baseURLPrefix, [
  {
    selector: ['.channel-news a.headline'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
