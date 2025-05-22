import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://ustr.gov';
const baseUrlSuffix = '/about-us/policy-offices/press-office/news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const publishedDate = $(el).find('.views-field-field-date time').text();
    if (moment(publishedDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $(el).find('.views-field-title a').attr('href');
      const headline = publishedDate;
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleQuery = 'h1.pageTitle';
  const fullTextQuery = 'article.node--view-mode-full';

  const title = fetchText(titleQuery, $, elements);
  const fullTextOfPost = fetchText(fullTextQuery, $, elements);
  const dateText = data[0];
  const date = moment(dateText, 'YYYY-MM-DD').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const source = 'USTR';

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}`;
  const extraDataInfo = {
    'Additional Data': fullTextOfPost,
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

export const parser = new LiteParser('USTR', baseUrlPrefix, [
  {
    selector: ['.view-content ul.listing li'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
