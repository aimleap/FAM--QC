import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.asafrance.fr';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('fr');
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('.actu-date.teaser').text().replace('Posté le', '')
      .trim();
    if (moment(articlePublishedDate, 'dddd DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h3.actu-titre.teaser a').attr('href');
      const description = $(el).find('.actu-article.teaser').text().replace(/\n+/g, ' ')
        .trim();
      threads.push({
        link: href,
        title: description,
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
  if (url === baseURL) return [];
  const discussionTitleQuery = 'h1.actu-titre.full';
  const dateQuery = '.actu-date.full';
  const articleTextQuery = '.actu-article.full';
  const dateText = fetchText(dateQuery, $, elements).trim().replace('Publié le', '').trim();
  const date = moment(dateText, 'dddd DD MMMM YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const description = data[0];
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${discussionTitle}, ${description}`;
  const extraDataInfo = {
    articleText,
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

export const parser = new LiteParser('ASAF France', baseURL, [
  {
    selector: ['div.actu-item.teaser'],
    parser: threadHandler,
  },
  {
    selector: ['.item'],
    parser: postHandler,
    name: 'post',
  },
]);
