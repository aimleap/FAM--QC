import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const domainUrl = 'https://www.pnp.de';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://www.pnp.de/lokales/landkreis-regen';
  const link2 = 'https://www.pnp.de/lokales/landkreis-traunstein';
  const link3 = 'https://www.pnp.de/lokales/landkreis-rottal-inn';
  const link4 = 'https://www.pnp.de/lokales/stadt-und-landkreis-landshut';
  const link5 = 'https://www.pnp.de/lokales/landkreis-freyung-grafenau';
  const link6 = 'https://www.pnp.de/lokales/landkreis-deggendorf';
  const link7 = 'https://www.pnp.de/lokales/landkreis-kelheim';
  const link8 = 'https://www.pnp.de/lokales/landkreis-dingolfing-landau';
  const link9 = 'https://www.pnp.de/lokales/stadt-und-landkreis-regensburg-oberpfalz';
  const link10 = 'https://www.pnp.de/lokales/stadt-und-landkreis-passau';
  const link11 = 'https://www.pnp.de/lokales/landkreis-berchtesgadener-land';
  const link12 = 'https://www.pnp.de/lokales/stadt-straubing-und-landkreis-straubing-bogen';
  const urls = [link1, link2, link3, link4, link5, link6, link7, link8, link9, link10, link11, link12];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
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
  if (url === domainUrl) return threads;
  elements.forEach((el) => {
    const href = $(el).find('a.article-teaser-headline').attr('href');
    const headline = $(el).find('a.article-teaser-headline').text().replace(/\n+/g, '')
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
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === domainUrl) return posts;
  const titleQuery = '.article-detail-headline';
  const dateQuery = '.date-published';
  const articleFullTextQuery = '.row #article-body p:not(figure p)';
  const date = fetchText(dateQuery, $, elements).split('|')[0].trim();
  if (!moment(date, 'DD.MM.YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
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
export const parser = new LiteParser('Passauer Neue Press', domainUrl, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.landing-page__block .row.nested-layout article.article-teaser'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['article.article-detail'],
    parser: postHandler,
    name: 'post',
  },
]);
