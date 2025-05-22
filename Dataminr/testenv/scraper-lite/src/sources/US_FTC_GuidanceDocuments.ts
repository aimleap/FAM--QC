import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.ftc.gov';
const baseUrlSuffix = '/legal-library/browse/policy-statements';
async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const publishedDate = $(el).find('.node__content .field__items time').text();
    if (moment(publishedDate, 'LL').isSame(moment().format('LL'), 'day')) {
      const href = $(el).find('.node__content h3.node-title a').attr('href');
      const headline = $(el).find('.node__content h3.node-title').text();
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
  const titleQuery = '.region h1.margin-0';
  const matterNumberQuery = '.main-content .node__content .field--name-field-matter-number  .field__item';
  const dateQuery = '.main-content .node__content .field--name-field-date  .field__item';

  const title = fetchText(titleQuery, $, elements);
  const matterNumber = fetchText(matterNumberQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'LL').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const source = 'US FTC Guidance Documents';

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}`;
  const additionalDataInfo = `Matter Number: ${matterNumber}`;
  const extraDataInfo = {
    'Additional Data': additionalDataInfo,
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

export const parser = new LiteParser(
  'US FTC Guidance Documents',
  baseUrlPrefix,
  [
    {
      selector: ['.main-content .region .view .main .views-row'],
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
