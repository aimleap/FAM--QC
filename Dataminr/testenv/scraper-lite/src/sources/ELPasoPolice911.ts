import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.epcsheriffsoffice.com';
const baseURLSuffix = '/community/press-releases';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.field--name-field-news-release-date').text();
    if (moment(articlePublishedDate, 'MMM DD, YYYY - hh:mm a').isSame(moment(), 'day')) {
      const href = $(el).find('.node__title a').attr('href');
      const title = $(el).find('.node__title a').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1';
  const dateQuery = '.field--name-field-news-release-date';
  const articleFullTextQuery = '#content .node__content>div:not(.field--name-field-news-release-date)';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${articleFullText}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
    Text: articleFullText,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('EL Paso Police 911', baseURLPrefix, [
  {
    selector: ['#content .view-content>.views-row'],
    parser: threadHandler,
  },
  {
    selector: ['main'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
