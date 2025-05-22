import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://podkarpacka.policja.gov.pl';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-brzozow/wydarzenia';
  const link2 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-lezajsk/wydarzenia';
  const link3 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-stalowa-wola/wydarzenia';
  const link4 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-jaslo/wydarzenia';
  const link5 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-jaroslaw/wydarzenia';
  const link6 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-debica/wydarzenia';
  const link7 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-strzyzow/wydarzenia';
  const link8 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-kolbuszowa/wydarzenia';
  const link9 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-lesko/wydarzenia';
  const link10 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kmp-rzeszow/wydarzenia';
  const link11 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-sanok/wydarzenia';
  const link12 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kmp-przemysl/wydarzenia';
  const link13 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-nisko/wydarzenia';
  const link14 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-ropczyce/wydarzenia';
  const link15 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-mielec/wydarzenia';
  const link16 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-lubaczow/wydarzenia';
  const link17 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-przeworsk/wydarzenia';
  const link18 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-lancut/wydarzenia';
  const link19 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kpp-ustrzyki-dolne/wydarzenia';
  const link20 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kmp-tarnobrzeg/wydarzenia';
  const link21 = 'https://podkarpacka.policja.gov.pl/rze/komendy-policji/kmp-krosno/wydarzenia';
  const urls = [link1, link2, link3, link4, link5, link6, link7, link8, link9, link10, link11, link12, link13, link14, link15, link16, link17, link18, link19, link20, link21];
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
  if (url === baseURL) return threads;
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('span.data').text().split(':')[1].trim();
    if (moment(articlePublishedDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
      const headline = $(el).find('a>strong').text().trim();
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
  if (url === baseURL) return posts;
  const titleQuery = '.head h2';
  const descriptionQuery = '.head .intro';
  const dodanoQuery = '#drukuj .data';
  const locationQuery = '#sciezka-naviUl>li:eq(2)';
  const articleFullTextQuery = 'article.txt p:not(p.intro)';
  const dodanoText = fetchText(dodanoQuery, $, elements).trim().replace('Data publikacji', '').trim();
  const date = moment(dodanoText, 'DD.MM.YYYY');
  if (!moment(date, 'DD.MM.YYYY').isSame(moment(), 'day')) return posts;
  $(elements).find('#article div.ArticleHeadstyled__ArticleHeadHeadlineContainer-sc-1xd2qac-0 span').remove();
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const location = fetchText(locationQuery, $, elements).replace('KPP ', '').replace('KMP ', '').trim();
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const articleInfo = `${title}; ${description}; ${dodanoText}; ${location}`;
  const extraDataInfo = {
    title,
    description,
    dodano: dodanoText,
    location,
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

export const parser = new LiteParser('Policja Podkarpacka', baseURL, [
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
    selector: ['#content'],
    parser: postHandler,
    name: 'post',
  },
]);
