import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.sdcexec.com';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.node__footer.node__footer--body>.node__footer-right').text();
    if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h5.node__title>a').attr('href');
      const headline = $(el).find('h5.node__title').text();
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
  const titleQuery = 'h1.page-wrapper__title';
  const descriptionQuery = '.page-wrapper__deck';
  const publishedDateQuery = '.page-dates__content-published';
  const informationSourceQuery = '.page-attribution__content-company-name';
  const articleTextQuery = '.page-contents__content-body';
  const publishedDate = fetchText(publishedDateQuery, $, elements).trim();
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const informationSource = fetchText(informationSourceQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(publishedDate, 'MMMM DD, YYYY').unix();
  const newsInfo = `${title}; ${description}; ${informationSource}; ${articleText}`;
  const extraDataInfo = {
    Title: title, Description: description, Text: articleText, From: informationSource,
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

export const parser = new LiteParser('Supply And Demand Chain Executive', baseURL, [
  {
    selector: ['.node-list__header:contains(Latest)+.node-list__nodes>.node-list__node'],
    parser: threadHandler,
  },
  {
    selector: ['article.page'],
    parser: postHandler,
    name: 'post',
  },
]);
