import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.ntsb.gov';
const baseUrlSuffix = '/news/press-releases/Pages/default.aspx';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const publishedDate = $(el).find('.time').text();
    if (moment(publishedDate, 'DD MMM YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.inner a').attr('href');
      const headline = $(el).find('.inner>h3').text().replace(/\n+/g, '')
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
  const titleQuery = 'h1';
  const fullTextQuery = 'section .ms-rtestate-field, section .ms-rtestate-field+p';
  const dateQuery = '.subtitle';

  const title = fetchText(titleQuery, $, elements);
  const fullTextOfPost = fetchText(fullTextQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MM/DD/YYYY').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const source = 'US National Transportation Safety Board';

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}`;
  const additionalDataInfo = `Additional Data: ${fullTextOfPost}`;
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

export const parser = new LiteParser('US National Transportation Safety Board', baseUrlPrefix, [
  {
    selector: ['.container .news-feed .box'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
