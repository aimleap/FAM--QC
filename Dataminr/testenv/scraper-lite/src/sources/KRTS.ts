import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://marfapublicradio.org';
const baseURLSuffix = '/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY-MM-DD');
  elements.forEach((el) => {
    const link = $(el).find('.PromoB-title a, .PromoA-title a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('.PromoB-title a, .PromoA-title a').attr('href');
      const description = $(el).find('.PromoB-description, .PromoA-description').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const $el = $(elements);
  const date = $el.find('.ArtP-timestamp meta').attr('content')?.split('T')[0];
  const titleQuery = '.ArtP-headline';
  const articleFullTextQuery = '.ArtP-articleBody';
  const title = fetchText(titleQuery, $, elements);
  const description = data[0];
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const articleInfo = `${title} ; ${description}`;
  const extraDataInfo = {
    title,
    description,
    articleFullText,
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

export const parser = new LiteParser(
  'KRTS',
  baseURLPrefix,
  [
    {
      selector: ['.OneColumnContainer-column ul li'],
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
