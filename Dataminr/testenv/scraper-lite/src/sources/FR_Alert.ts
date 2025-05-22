import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.fr-alert.gouv.fr';
const baseURLSuffix = '/les-alertes';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('fr');
  const today = moment();

  elements.forEach((el) => {
    // Jeudi 13 octobre 2022
    if (
      moment($(el).find('.date-title').text(), 'ddd D MMMM YYYY').format('MM/DD/YYYY')
      !== today.format('MM/DD/YYYY')
    ) return;

    $(el)
      .find('.alert-item')
      .each((i, alert) => {
        threads.push({
          title: $(alert).find('.alert-header .alert-title').text().trim(),
          link: $(alert).find('a').attr('href'),
          parserName: 'post',
        });
      });
  });

  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];

  moment.locale('fr');
  const typeOfEventQuery = 'h2.header-title';
  const dateQuery = '.alert-date strong';
  const textQuery = '.description-body .description-body-text ~p';
  const expireQuery = '.complementary-information-item:contains(Fin de l\'alerte)';
  const sourceQuery = '.complementary-information-item:contains(Source)';
  const locationQuery = '.alert-place';
  const typeOfEvent = fetchText(typeOfEventQuery, $, elements);
  const location = fetchText(locationQuery, $, elements).replace(/\s+/g, ' ');
  const text = $(elements)
    .find(`${textQuery}`)
    .text()
    .replace(/\n+/g, ' ')
    .replace(/\t+/g, ' ')
    .trim();
  const expire = fetchText(expireQuery, $, elements);
  const source = fetchText(sourceQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YYYY');
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const alertInfo = `${typeOfEvent} ; ${location} ; ${text}`;
  const extraDataInfo = {
    expire,
    source,
    Date: date,
  };
  return [
    new Post({
      text: alertInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  ];
}

export const parser = new LiteParser(
  'FR-Alert',
  baseURLPrefix,
  [
    {
      selector: ['section.date'],
      parser: threadHandler,
    },
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
  { strictSSL: false },
);
