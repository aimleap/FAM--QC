import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://lexpress.mu/regions';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURL}/${index}`,
      parserName: 'threads',
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
  if (url === baseURL) {
    return threads;
  }
  moment.locale('fr');
  elements.forEach((el) => {
    const $el = $(el);
    const articlePublishedDate = $el.find('.metadata-wrapper').text().trim().replace(/\s\s+/g, ' ');
    if (moment(articlePublishedDate, 'lll').isSame(moment(), 'day')) {
      const href = $el.find('.title-wrapper a').attr('href');
      const headline = $el.find('.title-wrapper a').text().trim();
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
  if (url === baseURL) {
    return posts;
  }
  const discussionTitleQuery = '.lx-block-header h1';
  const dateQuery = '.icon-calendar+a';
  const articleTextQuery = '.article-content p';
  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'll').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
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

export const parser = new LiteParser('Lexpress', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.sub-section-container .single-content-card .description-wrapper'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['article.single-article'],
    parser: postHandler,
    name: 'post',
  },
]);
