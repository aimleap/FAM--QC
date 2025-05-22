import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.aerocontact.com';
const baseURLSuffix = '/actualite-aeronautique-spatiale/actualites-aeronautique.html';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const today = moment();
  return elements
    .filter((el) => {
      const publishedDate = $(el).find('.encart-when').text().split('|')[0].trim();
      const timestamp = moment(publishedDate, 'DD/MM/YYYY');
      return timestamp.format('DD/MM/YYYY') === today.format('DD/MM/YYYY');
    })
    .map((el) => ({
      link: $(el).find('.encart-tete a').attr('href'),
      title: $(el).find('.encart-tete a').text().trim(),
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
  $el.find('.encart-redirection').remove();
  const titleQuery = 'h1.marine';
  const articleTextQuery = '.art';
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const date = $el.find('.encart-when').text().split('|')[0].trim();
  const timestamp = moment(date, 'DD/MM/YYYY').unix();
  const newsInfo = `${title}`;
  const extraDataInfo = {
    articleText,
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
  'Aero Contact',
  baseURLPrefix,
  [
    {
      selector: ['.encart-actu'],
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
