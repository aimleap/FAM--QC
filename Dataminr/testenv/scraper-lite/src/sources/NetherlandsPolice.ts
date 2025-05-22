import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.politie.nl/nieuws';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('nl');
  const todayDate = moment().format('YYYY/MMMM/DD');
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).find('h3, h2').text().trim();
    if (href.includes(todayDate)) {
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
  moment.locale('nl');
  const titleQuery = 'h1.magazine';
  const descriptionQuery = '.intro';
  const dateQuery = 'time.publish-date__datetime';
  const articleFullTextQuery = '.grid-container .text-block';
  const dateText = fetchText(dateQuery, $, elements).split('|')[0].trim();
  const date = moment(dateText, 'DD-MM-YYYY').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'DD-MM-YYYY').unix();
  const articleInfo = `${title}; ${description}`;
  const extraDataInfo = {
    title,
    description,
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

export const parser = new LiteParser('Netherlands Police', baseURL, [
  {
    selector: ['a.link-card, .overview-item>a'],
    parser: threadHandler,
  },
  {
    selector: ['#main-content'],
    parser: postHandler,
    name: 'post',
  },
]);
