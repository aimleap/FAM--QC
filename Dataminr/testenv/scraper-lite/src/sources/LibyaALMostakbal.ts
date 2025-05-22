import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.libya-al-mostakbal.org';
const baseUrlSuffix = '/news_libya';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${appendLink(baseUrlPrefix, baseUrlSuffix)}?page=${index}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text().replace(/\n+/g, '');
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

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  moment.locale('ar-ly');
  const discussionTitleQuery = '.article>h1:not(a>h1)';
  const dateQuery = '.article .date_author';
  const articleTextQuery = '.article .txt p';

  let dateText = fetchText(dateQuery, $, elements).trim();
  dateText = dateText?.split('| ')[1].trim();
  const date = moment(dateText, 'YYYY/MM/DD hh:mm').format('MM/DD/YYYY hh:mm');
  if (!moment(date, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) return posts;

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm').unix();
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

export const parser = new LiteParser('Libya AL Mostakbal', baseUrlPrefix, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.contener_right .liste_article .article'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['.contener_right .details_article'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
