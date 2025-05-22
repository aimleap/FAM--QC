import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.brudirect.com';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.brudirect.com/viewall_national-national.php';
  const link2 = 'https://www.brudirect.com/viewall_national-inthecourt.php';
  const urls = [link1, link2];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
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
  elements.forEach((el) => {
    const postDate = $(el).find('td .m_2:eq(2)').text().split('|')[0].trim();
    if (moment(postDate, 'MMMM Do, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('td .m_2:eq(0) a').attr('href');
      const headline = $(el).find('td .m_2:eq(1)').text().trim();
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

  const $el = $(elements);
  $el.find('.top_box').remove();
  const titleQuery = '.m_1';
  const articleFullTextQuery = '.cont .sky-form span[style="text-align: justify;"]';

  const title = fetchText(titleQuery, $, elements);
  const date = $el.find('.cont .sky-form .m_2:eq(2)').text().split('|')[0]?.trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM Do, YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    date,
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
  return posts;
}

export const parser = new LiteParser(
  'Bru Direct',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.cont table tbody tr'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
