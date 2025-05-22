import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.transportation.gov';
const baseURLSuffix = '/newsroom/press-releases?field_effective_date_value=01/20/2021&field_effective_date_value_1&keys&field_mode_target_id=All&page=0';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const releaseDate = $el.find('.date_format').text().trim();
    if (moment(releaseDate, 'LL').isSame(moment(), 'day')) {
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const titleQuery = 'h1.page__title';
  const dateQuery = '.node__content .mb-4:not(.clearfix)';
  const fullTextQuery = '.node__content .mb-4 p:not(.text-align-center)';

  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'dddd, LL').format('MM/DD/YY');
  const source = 'US Department of Transportation';
  const fullText = fetchText(fullTextQuery, $, elements);
  const additionalData = `${fullText}`;

  const timestamp = moment(date, 'MM/DD/YY').unix();
  const pressReleaseInfo = `Title: ${title}, Date: ${date}, Source: ${source}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
  };

  posts.push(
    new Post({
      text: pressReleaseInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );

  return posts;
}

export const parser = new LiteParser(
  'US Department Of Transportation',
  baseURLPrefix,
  [
    {
      selector: ['.main-content .list_news .card-body'],
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
