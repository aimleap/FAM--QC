import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://kitchener.ctvnews.ca';
const baseURLSuffix = '/local-news';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('h2.teaserTitle a').attr('href');
    const headline = $(el).find('.teaserLead').text().replace(/\n+/g, '')
      .replace(/\t+/g, '')
      .trim();
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1.c-title__text';
  const dateQuery = 'article-publish-update-date';
  const articleFullTextQuery = '.c-text';
  const dateText = $(elements).find(`${dateQuery}`).attr('published-date');
  const date = moment(dateText, 'ddd MMM DD hh:mm:ss YYYY').format('MM/DD/YYYY HH:mm');
  if (!moment(date, 'MM/DD/YYYY HH:mm').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const subTitle = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY HH:mm').unix();
  const articleInfo = `ontario: ${title}; ${subTitle}`;
  const extraDataInfo = {
    title: `ontario: ${title}`,
    subtitle: subTitle,
    articleFullText,
    date,
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

export const parser = new LiteParser('CTV News Kitchener', baseURLPrefix, [
  {
    selector: ['.content-primary ul li.dc'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
