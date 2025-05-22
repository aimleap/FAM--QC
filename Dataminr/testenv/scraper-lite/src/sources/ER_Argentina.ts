import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { Selectors, extractPosts } from '../lib/sourceUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const jsonArray = JSON.parse(response.body);
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.fecha, 'DD/MM/YYYY').format('MM/DD/YYYY');
    if (moment(articlePublishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const { id } = jObj;
      const headline = jObj.noticia
        .substr(0, 400)
        .replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .replace(/\r+/g, '');
      threads.push({
        link: `https://xrargentina.org/noticia.php?id=${id}`,
        title: `${articlePublishedDate}~${headline}`,
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

  if (url === 'https://xrargentina.org/backend/listarNoticias.php') {
    return posts;
  }
  const titleSelector = 'h1.page-title';
  const bodySelector = '.contenidoNoticia';
  const imageSelector = '#noticiaCompleta img~src';
  const location = 'Argentina';
  const selectorList: Selectors = { titleSelector, bodySelector, imageSelector };
  return extractPosts(selectorList, elements, $, url, data, 'https://xrargentina.org/', location);
}

export const parser = new LiteParser(
  'Extinction Rebellion Argentina',
  'https://xrargentina.org/',
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  'backend/listarNoticias.php',
);
