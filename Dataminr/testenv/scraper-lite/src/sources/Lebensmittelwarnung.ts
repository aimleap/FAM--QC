import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.lebensmittelwarnung.de';
const baseURLSuffix = '/bvl-lmw-de/liste/alle/deutschlandweit/20/0';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $(el).find('.datum .plainTextProperty').text();
    if (moment(date, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const href = $el.find('.detailsButton a').attr('href');
      const headline = $el.find('.produktbezeichnung .plainTextProperty').text();
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const titleQuery = '.visible-md-block .form-group label:contains(Warnungstyp:)+div';
  const descriptionQuery = '.visible-md-block .form-group label:contains(Grund der Warnung:)+div';
  const dateQuery = '.visible-md-block .form-group label:contains(Datum der ersten Veröffentlichung:)+div';
  const entitiesQuery = '.visible-md-block .form-group label:contains(Hersteller (Inverkehrbringer):)+div';
  const typeQuery = '.visible-md-block .form-group label:contains(Warnungstyp:)+div';
  const furtherInfoQuery = '.visible-md-block .form-group label:contains(Weitere Informationen:)+div';

  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const source = 'Lebensmittelwarnung';
  const entities = fetchText(entitiesQuery, $, elements);
  const type = fetchText(typeQuery, $, elements);
  const furtherInfo = fetchText(furtherInfoQuery, $, elements);

  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const textInfo = `Title: ${title}, Description: ${description}, Date: ${date}, Source: ${source}, Entities: ${entities}, Type: ${type}`;
  const extraDataInfo = {
    Title: title,
    Description: description,
    Date: date,
    Source: source,
    Entities: entities,
    Type: type,
    'Further Info': furtherInfo,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Lebensmittelwarnung',
  baseURLPrefix,
  [
    {
      selector: ['#content #osForm .iterator .iteratorRow'],
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
