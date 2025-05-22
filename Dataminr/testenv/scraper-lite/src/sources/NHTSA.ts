import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.nhtsa.gov';
const baseUrlSuffix = '/press-releases';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const releasedDate = $el.find('.views-field-field-date').text();
    if (moment(releasedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('.views-field-title a').attr('href');
      const title = $el.find('.views-field-title a').text().trim();
      threads.push({
        link: href,
        title,
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
  const titleQuery = 'h1.page-header--alt-heading';
  const fullTextQuery = '.article--copy-container .article--copy';
  const dateQuery = '.article--copy-intro--date-location>span';

  const title = fetchText(titleQuery, $, elements);
  const fullText = fetchText(fullTextQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'LL').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const source = 'NHTSA';

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}`;
  const additionalDataInfo = `${fullText}`;
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

export const parser = new LiteParser('NHTSA', baseUrlPrefix, [
  {
    selector: ['.table-responsive>table.views-table>tbody>tr'],
    parser: threadHandler,
  },
  {
    selector: ['article.main-content'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
