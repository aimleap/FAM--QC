import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.voxlog.fr/tout-actualites/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('fr');
  elements.forEach((el) => {
    const date = $(el).find('.contentDate').text().split('-')[0].trim();
    if (moment(date, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.contentTitle a').attr('href');
      const headline = $(el).find('.contentTitle a').text();
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
  if (url === baseURL) return posts;
  moment.locale('fr');
  const titleQuery = '.innerContent article .contentTitle';
  const descriptionQuery = '.innerContent article .contentIntro';
  const publishedDateQuery = '.innerContent article .contentPropertiesDate';
  const articleTextQuery = '.innerContent article .contentArticleText .contentMainText';
  const sectionQuery = '.headerListing.article, .innerContent article .contentCategorie';
  const publishedDate = fetchText(publishedDateQuery, $, elements).replace('Publié le', '').split('-')[0].trim();
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const section = fetchText(sectionQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(publishedDate, 'DD MMMM YYYY').unix();
  const newsInfo = `${title}; ${description}; ${articleText}`;
  const extraDataInfo = {
    Title: title, Description: description, Text: articleText, Date: publishedDate, Section: section,
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

export const parser = new LiteParser('Voxlog', baseURL, [
  {
    selector: ['article,.podcastModule'],
    parser: threadHandler,
  },
  {
    selector: ['#articleContent'],
    parser: postHandler,
    name: 'post',
  },
]);
