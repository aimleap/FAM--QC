import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.total-croatia-news.com';
const baseUrlSuffix = '/news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const articlePublishedDate = $el.find('span.listingPage-leading-date, span.listingPage-item-date').text().trim();
    if (moment(articlePublishedDate, 'dddd, DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h2 a').attr('href');
      const headline = $el.find('h2 a').text().replace(/\n+/g, '').replace(/\t+/g, '');
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

  $(elements).find('noscript').remove();
  const discussionTitleQuery = 'h1.itemPage-title';
  const dateQuery = '.itemPage-date';
  const articleTextQuery = '.itemPage-fulltext';

  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
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

export const parser = new LiteParser('Total Croatia News', baseUrlPrefix, [
  {
    selector: ['.listingPage-leading,.listingPage-item'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
