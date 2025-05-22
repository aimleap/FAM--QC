import moment from 'moment';
import LiteParser from './parsers/liteParser';
import { extractIlboPosts, IlboSelectors } from './sourceUtil';
import { Post, Thread } from './types';

export async function preThreadHandler(domainUrl: string, appendUrl: string): Promise<Thread[]> {
  return Array.from(Array(10 + 1).keys()).slice(1).map((index) => ({
    link: `${domainUrl}${appendUrl}&page=${index}`,
    parserName: 'thread',
  }));
}

export async function threadHandler(
  domainUrl: string,
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  if (url === domainUrl) return [];

  return elements
    .filter((el) => {
      const articlePublishedDate = $(el).find('.byline em:eq(2)').text().trim();
      return moment(articlePublishedDate, 'YYYY.MM.DD hh:mm').isSame(moment(), 'day');
    })
    .map((el) => ({
      link: $(el).find('h4.titles a').attr('href'),
      title: $(el).find('p.lead').text().replace(/\n+/g, '')
        .replace(/\t+/g, ' ')
        ?.trim(),
      parserName: 'post',
    }));
}

export async function postHandler(
  selectorList: IlboSelectors,
  domainUrl: string,
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  if (url === domainUrl) return [];
  return extractIlboPosts(selectorList, elements, $, url, data);
}

export function createIlboParser(name: string, domainUrl: string, appendUrl: string) {
  return new LiteParser(name, domainUrl, [
    {
      selector: ['*'],
      parser: preThreadHandler.bind(null, domainUrl, appendUrl),
    },
    {
      selector: ['#section-list ul li'],
      parser: threadHandler.bind(null, domainUrl),
      name: 'thread',
    },
    {
      selector: ['body'],
      parser: postHandler.bind(
        null,
        {
          titleQuery: 'h3.heading',
          dateQuery: '.infomation li:eq(1)',
          articleTextQuery: 'article#article-view-content-div',
        },
        domainUrl,
      ),
      name: 'post',
    },
  ]);
}
