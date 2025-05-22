import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://jnilbo.com';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://jnilbo.com/section.php?sid=440'; // Politics
  const link2 = 'https://jnilbo.com/section.php?sid=643'; // Admin/Parliament
  const link3 = 'https://jnilbo.com/section.php?sid=467'; // Society/Education
  const link4 = 'https://jnilbo.com/section.php?sid=555'; // Jeonnam
  const urls = [link1, link2, link3, link4];
  for (let i = 0; i < urls.length; i++) {
    for (let j = 1; j < 3; j++) {
      preThreads.push({
        link: `${urls[i]}&page=${j}`,
        parserName: 'threads',
      });
    }
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === baseURL) return threads;
  return elements.filter((el) => {
    const articlePublishedDate = $(el).find('span.newsdate').text().trim();
    return moment(articlePublishedDate, 'YYYY.MM.DD hh:mm').isSame(moment(), 'day');
  }).map((el) => ({
    link: $(el).find('a').attr('href'),
    title: $(el).find('a div').text(),
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return [];
  const titleQuery = '#adttl';
  const dateQuery = 'ul#byline li:eq(0)';
  const articleTextQuery = '#content';
  const dateText = fetchText(dateQuery, $, elements).replace('입력 :', '').trim();
  const date = moment(dateText, 'YYYY-MM-DD hh:mm').format('MM/DD/YYYY');
  $(elements).find('.adttl2, #byline, #social').remove();
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm').unix();
  const newsInfo = `${title}`;
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

export const parser = new LiteParser('Jeonnam Ilbo', baseURL, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.cont_left ul.section_list li'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
