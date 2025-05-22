import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.sowetanlive.co.za';
const baseURLSuffix = '/news/south-africa/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const todaysDate = moment().format('YYYY-MM-DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('.first-article > a, .title a, .content > a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $el.find('.first-article > a, .title a, .content > a').attr('href');
      const headline = $el.find('.first-article > a, .title a, .content > a').text().replace(/\n+/g, '').trim();
      threads.push({
        link: href,
        title: `${headline}~${moment(todaysDate, 'YYYY-MM-DD').format('MM/DD/YYYY')}`,
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const titleQuery = 'h1.article-title';
  const textQuery = '.wrap .text p, .row p:not(.questions, .comment-policy)';

  const discussionTitle = fetchText(titleQuery, $, elements);
  const dateText = data[0].split('~')[1];
  const articleText = fetchText(textQuery, $, elements);
  const timestamp = moment(dateText, 'MM/DD/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: `${dateText}`,
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

export const parser = new LiteParser(
  'Sowetan',
  baseURLPrefix,
  [
    {
      selector: ['.grid .section-article'],
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
