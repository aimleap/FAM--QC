import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.policia.ad';
const baseURLSuffix = '/ca/noticies/categoria/noticies/?pagina=1';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const date = moment($(el).find('ul li:eq(0)').text(), 'DD/MM/YYYY hh:mm').format('MM/DD/YYYY');
    if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h3 a').attr('href');
      const headline = $(el).find('h3').text();
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const headlineQuery = '.post_title h2';
  const dateQuery = '.post_title ul li:eq(0)';
  const textQuery = '.post_body';

  const headline = fetchText(headlineQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'DD/MM/YYYY hh:mm').unix();
  const textInfo = `${date}, ${text}`;
  const extraDataInfo = {
    discussion_title: headline,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Andorra Police',
  baseURLPrefix,
  [
    {
      selector: ['.post_item'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
