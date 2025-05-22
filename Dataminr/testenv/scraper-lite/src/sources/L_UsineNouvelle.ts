import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.usinenouvelle.com/';
const baseURLSuffix = 'aero-spatial/';

moment.locale('fr');

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  return elements.map((el) => ({
    link: $(el).find('.editoCardType1__title a').attr('href'),
    title: $(el).find('.editoCardType1__title a').text().trim(),
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];

  const dateQuery = 'p .epMetaData__content__infos-dateValue time';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YYYY');

  if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
    const titleQuery = '.editoTitleType8';
    const articleTextQuery = '.articleContent > p';
    const title = fetchText(titleQuery, $, elements);
    const articleText = fetchText(articleTextQuery, $, elements);
    const timestamp = moment(date, 'MM/DD/YYYY').unix();
    const newsInfo = `${title}`;
    const extraDataInfo = {
      articleText,
    };

    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  "L'Usine Nouvelle",
  baseURLPrefix,
  [
    {
      selector: ['.editoCardType1:not(.jqGoogleAdServe)'],
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
