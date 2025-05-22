import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp).unix();

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const yesterday = moment().subtract(1, 'day').format('YYYY/MM/DD');
  const today = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $(el).find('a').attr('href');
    if (link.includes(yesterday) || link.includes(today)) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a').text();
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
  const $el = $(elements);

  const articleTitle = $el.find('.entry-header>.entry-title').text().trim();
  const articlePublishedTime = $el.find('.posted-on>.entry-date.published').attr('datetime');
  const articleText = $el.find('.main-content>article>.entry-content>*:not(nav)').text().trim();
  const timestamp = toUnixTimestamp(articlePublishedTime);
  const articleInfo = `Title: ${articleTitle}, Published: ${articlePublishedTime}, Article Text: ${articleText}`;
  const extraDataInfo = {
    Article_Title: articleTitle,
    Date: articlePublishedTime,
    Article_Text: articleText,
  };

  if (typeof articlePublishedTime !== 'undefined') {
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

export const parser = new LiteParser('Our Weekly', 'https://ourweekly.com/', [
  {
    selector: ['.entry-wrapper .entry-title'],
    parser: threadHandler,
  },
  {
    selector: ['.site-main'],
    parser: postHandler,
    name: 'post',
  },
]);
