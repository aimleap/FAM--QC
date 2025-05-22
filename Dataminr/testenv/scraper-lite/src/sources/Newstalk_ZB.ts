import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.newstalkzb.co.nz/';

async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('a').text();
    preThreads.push({
      link: href,
      title: headline,
      parserName: 'thread',
    });
  });
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
    const href = $el.find('a, .article__content .article__title a').attr('href');
    const headline = $el.find('a, .article__content .article__title a').text();
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
  const date = $el.find('.hide .c-story-header__date dd:eq(1)').attr('datetime').split('T')[0];
  const formattedDate = moment(date, 'DD-MM-YYYY').format('MM/DD/YY');

  if (moment(formattedDate, 'MM/DD/YY').isSame(moment(), 'day')) {
    const titleQuery = '.layout__content .hide h1.c-story-header__title';
    const textQuery = '.c-story__content';

    const text = fetchText(textQuery, $, elements);
    const title = fetchText(titleQuery, $, elements);

    const timestamp = moment(formattedDate, 'MM/DD/YY').unix();
    const textInfo = `Text: ${text}`;
    const extraDataInfo = {
      discussion_title: title,
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

export const parser = new LiteParser('Newstalk ZB', baseURL, [
  {
    selector: ['.navgiation__section .navigation__sub .navigation__columns .navigation__ticker-item:contains(National), .navgiation__section .navigation__sub .navigation__columns .navigation__ticker-item:contains(Crime), .navgiation__section .navigation__sub .navigation__columns .navigation__ticker-item:contains(Emergency)'],
    parser: preThreadHandler,
  },
  {
    selector: ['.article-list .row .article .article__content h2.article__title , .layout__content .layout__content article'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
