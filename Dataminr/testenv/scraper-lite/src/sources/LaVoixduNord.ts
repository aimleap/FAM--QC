import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.lavoixdunord.fr';
const baseURLSuffix = '/region/lens-et-ses-environs';
async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY-MM-DD');
  elements.forEach((el) => {
    const articleLink = $(el).find('a.r-article--link, a.r-direct--link').attr('href');
    if (articleLink.includes(todaysDate)) {
      const href = $(el).find('a.r-article--link, a.r-direct--link').attr('href');
      const headline = $(el).find('a.r-article--link, a.r-direct--link').text();
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'header.r-article--header h1';
  const articleFullTextQuery = 'r-article--chapo, r-article--section';
  const todaysDate = moment().format('DD/MM/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(todaysDate, 'DD/MM/YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    date: todaysDate,
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

export const parser = new LiteParser(
  'La Voix du Nord',
  baseURLPrefix,
  [
    {
      selector: ['r-viewmode article.r-viewmode--article, r-direct--list article.r-direct--item'],
      parser: threadHandler,
    },
    {
      selector: ['article.r-article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
