import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.rbb24.de/';
async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).find('.manualteasertitle, .tabmodul_title').text().trim();
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
  if (url === baseURL) return posts;
  moment.locale('de');
  const titleQuery = '.titletext';
  const descriptionQuery = '.shorttext';
  const dateQuery = '.lineinfo';
  const articleFullTextQuery = '.shorttext, .texttitle, .textblock';
  const dateText = fetchText(dateQuery, $, elements).split('|')[0].trim();
  const date = moment(dateText, 'dd DD.MM.YY').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
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

export const parser = new LiteParser('RBB24', baseURL, [
  {
    selector: [
      '#main>section.count1 h3 a, #main>div.count2 h3 a, #main>section.count4 h3>a, section.count7 h3>a, .tabmodul_container li.active ul li a',
    ],
    parser: threadHandler,
  },
  {
    selector: ['article.layoutarticlemodule'],
    parser: postHandler,
    name: 'post',
  },
]);
