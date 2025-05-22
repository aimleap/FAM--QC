import moment from 'moment/moment';
import { Post, Thread } from './types';
import { ArticleSelectors, extractArticlePosts } from './sourceUtil';
import LiteParser from './parsers/liteParser';

export async function preThreadHandler(domainUrl: string, appendUrl: string): Promise<Thread[]> {
  return [1, 2].map((index) => ({
    link: `${domainUrl}${appendUrl}${index}`,
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
      const articlePublishedDate = $(el).find('span.date').text().split('|')[0].trim();
      return moment(articlePublishedDate, 'DD.MM.YYYY').isSame(moment(), 'day');
    })
    .map((el) => ({
      link: $(el).find('a').attr('href'),
      title: $(el).find('a').text(),
      parserName: 'post',
    }));
}

export async function postHandler(
  selectorList: ArticleSelectors,
  domainUrl: string,
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  if (url === domainUrl) return [];
  return extractArticlePosts(selectorList, elements, $, url);
}

export function createPoliceParser(name: string, domainUrl: string, appendUrl: string) {
  return new LiteParser(name, domainUrl, [
    {
      selector: ['*'],
      parser: preThreadHandler.bind(null, domainUrl, appendUrl),
    },
    {
      selector: ['.page_content .news_item'],
      parser: threadHandler.bind(null, domainUrl),
      name: 'thread',
    },
    {
      selector: ['.article_content'],
      parser: postHandler.bind(
        null,
        {
          discussionTitleQuery: 'h1',
          discussionSubTitleQuery: '.page_content h3',
          dateQuery: '.time_info',
          articleTextQuery: '.page_content',
        },
        domainUrl,
      ),
      name: 'post',
    },
  ]);
}
