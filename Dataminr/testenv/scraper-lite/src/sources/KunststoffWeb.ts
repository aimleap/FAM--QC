import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.kunststoffweb.de';
const baseUrlSuffix = '/branchen-news/';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $el.find('.news-date').text();
    if (moment(newsDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a.linkgroup').attr('href');
      const headline = $el
        .find('.linkgroup__title')
        .text()
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const headlineQuery = 'h1.title-headline';
  const dateQuery = '.date';
  const descriptionQuery = '#artikel-content p';
  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const textInfo = `${headline} ; ${description}`;
  const extraDataInfo = {
    Title: headline,
    Description: description,
    Date: date,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'KunststoffWeb',
  baseUrlPrefix,
  [
    {
      selector: ['li.news'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
