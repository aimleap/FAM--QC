import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.braunschweiger-zeitung.de';
const baseURLSuffix = '/wolfsburg/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('.teaser__headline').text();
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
  const newsDate = $el.find('time.teaser-stream-time').attr('datetime')?.split('T')[0];
  if (moment(newsDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    const headlineQuery = 'h2.article__header__headline';
    const locationQuery = 'article .article__location';
    const descriptionQuery = '.article__header__intro__text span:eq(1)';
    const textQuery = 'article div.article__body h3, article div.article__body p';
    const headline = fetchText(headlineQuery, $, elements);
    const location = fetchText(locationQuery, $, elements);
    const description = fetchText(descriptionQuery, $, elements);
    $el.find('article #paywall-container').remove();
    const text = fetchText(textQuery, $, elements);
    const timestamp = moment(newsDate, 'YYYY-MM-DD').unix();
    const textInfo = `${location}:${headline} ; ${description}`;
    const extraDataInfo = {
      location,
      headline,
      description,
      text,
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
  'Wolfsburger Nachrichten',
  baseURLPrefix,
  [
    {
      selector: ['.collapsable__content article, .content article'],
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
