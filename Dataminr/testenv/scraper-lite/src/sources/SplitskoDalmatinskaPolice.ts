import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { ArticleSelectors, extractArticlePosts } from '../lib/sourceUtil';

const domainUrl = 'https://splitsko-dalmatinska-policija.gov.hr';

async function preThreadHandler(): Promise<Thread[]> {
  return [1, 2].map((index) => ({
    link: `${domainUrl}/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=${index}`,
    parserName: 'thread',
  }));
}

async function threadHandler(
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
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  if (url === domainUrl) return [];
  return extractArticlePosts(selectorList, elements, $, url);
}

export const parser = new LiteParser('Splitsko-Dalmatinska Police', domainUrl, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.page_content .news_item'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['.article_content'],
    parser: postHandler.bind(null, {
      discussionTitleQuery: 'h1',
      discussionSubTitleQuery: '.page_content h3',
      dateQuery: '.time_info',
      articleTextQuery: '.page_content',
    }),
    name: 'post',
  },
]);
