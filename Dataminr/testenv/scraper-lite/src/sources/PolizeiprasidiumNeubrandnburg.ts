import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.polizei.mvnet.de';
const baseURLSuffix = '/Presse/Pressemitteilungen/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.teaser_meta .dtstart').text();
    if (moment(articlePublishedDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h3>a').attr('href');
      const description = $(el).find('.teaser_text>p').text().trim();
      threads.push({
        link: href,
        title: description,
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1';
  const dateQuery = '.teaser_meta .dtstart';
  const articleFullTextQuery = '.dvz-contenttype-presseserviceassistent p';
  const date = fetchText(dateQuery, $, elements).trim().trim();
  if (!moment(date, 'DD.MM.YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const articleInfo = `${title}; ${description}`;
  const extraDataInfo = {
    title,
    description,
    date,
    articleFullText,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser('Polizeiprasidium Neubrandnburg', baseURLPrefix, [
  {
    selector: ['.resultlist .teaser'],
    parser: threadHandler,
  },
  {
    selector: ['#page .dvz-viewarea-main_area'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
