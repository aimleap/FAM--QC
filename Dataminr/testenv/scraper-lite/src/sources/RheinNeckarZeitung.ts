import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.rnz.de';
const baseURLSuffix = '/region.html';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('div p.nfy-teaser-title:eq(1)').text();
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

  const $el = $(elements);
  const newsDate = $el.find('.col-auto .me-3:eq(0)').text();
  if (moment(newsDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
    const headlineQuery = 'h1.h1';
    const descriptionQuery = 'h2.nfy-reader-teaser';
    const textQuery = '.nfy-reader-text p';
    const headline = fetchText(headlineQuery, $, elements);
    const description = fetchText(descriptionQuery, $, elements);
    const text = fetchText(textQuery, $, elements);
    const timestamp = moment(newsDate, 'DD.MM.YYYY').unix();
    const textInfo = `${headline} ; ${description}`;
    const extraDataInfo = {
      Headline: headline,
      Description: description,
      Text: text,
      ingestpurpose: 'mdsbackup',
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
  'Rhein Neckar Zeitung',
  baseURLPrefix,
  [
    {
      selector: ['.container article'],
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
