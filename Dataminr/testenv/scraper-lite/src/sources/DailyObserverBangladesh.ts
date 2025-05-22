import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://observerbd.com/';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURL}cat.php?cd=230&pg=${index}`,
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
  if (url === baseURL) {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('.title_inner a').attr('href');
    const headline = $el.find('.title_inner').text().trim();
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

  if (url === baseURL) {
    return posts;
  }

  const $el = $(elements);
  $el.find('tbody figure').remove();
  const dateText = $el.find('tbody .pub span:eq(0)').text().split('Published :')[1].trim();
  const date = `${dateText.split('at')[0].trim()} ${dateText.split('at')[1].trim()}`;
  const formattedDate = moment(date, 'dddd, DD MMMM, YYYY hh:mm a').format('MM/DD/YY hh:mm');
  if (moment(formattedDate, 'MM/DD/YY hh:mm').isSame(moment(), 'day')) {
    const headlineQuery = 'tbody h1';
    const textQuery = 'tbody #f > div';

    const headline = fetchText(headlineQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(formattedDate, 'MM/DD/YY hh:mm').unix();
    const textInfo = `${text}`;
    const extraDataInfo = {
      discussion_title: headline,
    };

    posts.push(
      new Post({
        text: textInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Daily Observer Bangladesh',
  baseURL,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['#toPrint .inner'],
      parser: threadHandler,
      name: 'thread',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
