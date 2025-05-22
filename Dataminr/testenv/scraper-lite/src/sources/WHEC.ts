import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseUrl = 'https://www.whec.com/top-news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('a').attr('href');
    const headline = $(el).find('h4, h5, h6').text().trim();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseUrl) return posts;
  const titleQuery = 'h1';
  const articleFullTextQuery = '#storyContent';
  const scriptText = $(elements).find('.yoast-schema-graph').get()[0].children[0].data.replaceAll('@', '');
  const json = JSON.parse(scriptText);
  const jsonArray = json.graph;
  let dateText = '';
  jsonArray.forEach((jObj: any) => {
    if (jObj.hasOwnProperty('datePublished')) {
      dateText = jObj.datePublished.split('T');
    }
  });
  const date = moment(dateText[0], 'YYYY-MM-DD').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    ingestpurpose: 'mdsbackup',
    date,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('WHEC', baseUrl, [
  {
    selector: ['h1:contains(Top News)+.row div[class^="col-12 col-lg-"]'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
