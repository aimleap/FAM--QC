import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.defense.gouv.fr';
const baseURLSuffix = '/actualites';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    moment.locale('fr');
    const articlePublishedDate = $(el).find('.fr-card__end').text().trim();
    if (moment(articlePublishedDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.fr-card__title.fr-title a').attr('href');
      const headline = $(el).find('.fr-card__title.fr-title').text().trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const discussionTitleQuery = 'h1:not(h1.fr-modal__title)';
  const dateQuery = '.fr-text--sm';
  const articleTextQuery = '.fr-richtext.fr-container';
  moment.locale('fr');
  const dateText = fetchText(dateQuery, $, elements).split('Publié le :')[1].trim();
  const date = moment(dateText, 'DD/MM/YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('French MOD', baseURLPrefix, [
  {
    selector: ['.layout-content article.fr-enlarge-link'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
