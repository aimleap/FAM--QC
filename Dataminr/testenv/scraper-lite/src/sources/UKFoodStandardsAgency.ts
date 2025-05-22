import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.food.gov.uk/search-api?filter_type%5BFood%20alert%5D=Food%20alert&filter_type%5BAllergy%20alert%5D=Allergy%20alert';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonArray = JSON.parse(response.body.replaceAll('#', '')).data.items;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = jObj.created_formatted;
    if (moment(articlePublishedDate, 'DD MMM YYYY').isSame(moment(), 'day')) {
      const href = jObj.url;
      const title = jObj.name.markup;
      threads.push({
        link: href,
        title,
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
  const titleQuery = '.article-hero__type--alerts, .article-hero h1.article-hero__title';
  const lastUpdateDateQuery = '.content-layout__top-desktop .article-hero__toolbar__last-updated';
  const summaryQuery = 'div.text-block';
  const lastUpdateDate = fetchText(lastUpdateDateQuery, $, elements).split(':')[1].trim();
  const title = fetchText(titleQuery, $, elements);
  const summary = fetchText(summaryQuery, $, elements);
  const timestamp = moment(lastUpdateDate, 'DD MMMM YYYY').unix();
  const foodAlertInfo = `${title}; ${lastUpdateDate}; ${summary}`;
  const extraDataInfo = {
    Title: title, 'Last Updated': lastUpdateDate, Summary: summary,
  };
  posts.push(
    new Post({
      text: foodAlertInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('UK Food Standards Agency', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['#main-content .content-layout__page'],
    parser: postHandler,
    name: 'post',
  },
]);
