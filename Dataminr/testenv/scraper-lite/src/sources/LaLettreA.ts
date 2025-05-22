import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.lalettrea.fr';
const baseURLSuffix = '/rub/entreprises_defense-et-aeronautique';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const today = moment();
  return elements
    .filter((el) => {
      const publishedDate = $(el).find('.label-date').text().trim();
      const timestamp = moment(publishedDate, 'DD/MM/YYYY');
      return timestamp.format('DD/MM/YYYY') === today.format('DD/MM/YYYY');
    })
    .map((el) => ({
      link: $(el).find('.article-content > a').attr('href'),
      title: $(el).find('h2.article-title').text().trim(),
      parserName: 'post',
    }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const $el = $(elements);
  const titleQuery = 'h1.article-title';
  const articleTextQuery = '.landing .article-chapo';
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const date = $el.find('.informations-supplementary .label-date').text().split('du')[1].trim();
  const timestamp = moment(date, 'DD/MM/YYYY').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
    date,
  };

  return [
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  ];
}

export const parser = new LiteParser(
  'La Lettre A',
  baseURLPrefix,
  [
    {
      selector: ['.mini-liste-articles article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
