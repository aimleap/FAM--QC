import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://lodzka.policja.gov.pl';
const baseURLSuffix = '/ld/informacje';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let i = 0; i < 3; i++) {
    preThreads.push({
      link: `${baseURLPrefix}${baseURLSuffix}?page=${i}`,
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return threads;
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('span.data').text().split(':')[1].trim();
    if (moment(articlePublishedDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const data = $(el).find('span.data').text().trim();
      const dodatek = $(el).find('span.dodatek').text().trim();
      const href = $(el).find('a').attr('href');
      const dateInfo = `${data} ${dodatek}`;
      threads.push({
        link: href,
        title: dateInfo,
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
  const titleQuery = '.head h2';
  const descriptionQuery = '.head .intro';
  const dodanoQuery = '#drukuj .data';
  const articleFullTextQuery = 'article.txt p:not(p.intro)';
  const dodanoText = data[1];
  let dateText = fetchText(dodanoQuery, $, elements).trim().replace('Data publikacji', '').trim();
  if (dateText.length === 0) {
    dateText = dodanoText?.split(':')[1].trim().split(' ')[0];
  }
  const responders = dodanoText.split(' ')[2].trim();
  const date = moment(dateText, 'DD.MM.YYYY');
  if (!moment(date, 'DD.MM.YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const articleInfo = `${title}; ${description}; ${dodanoText}; ${responders}`;
  const extraDataInfo = {
    title,
    description,
    dodano: dodanoText,
    responders,
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

export const parser = new LiteParser('Policja Lodzka', baseURLPrefix, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.okno ul>li.news'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['#content article.txt'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
