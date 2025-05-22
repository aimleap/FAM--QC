import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const todaysDate = moment().format('YYYY/MM/DD');

const baseURLPrefix = 'https://www.live5news.com';
const baseURLSuffix = '/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('h4.headline a').attr('href');
    const headline = $(el).find('h4.headline').text().trim();
    const subHeading = $(el).find('.deck').text().trim();
    threads.push({
      link: href,
      title: `${headline}~${subHeading}`,
      parserName: 'post',
    });
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const $el = $(elements);
  if (url.includes(todaysDate)) {
    const titleQuery = 'h1.headline';
    const articleFullTextQuery = '.article-body .article-text';
    const county = $el.find('.article-body .article-text').text().split('-')[0].trim();
    const title = fetchText(titleQuery, $, elements);
    const subTitle = data[0].split('~')[1];
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(todaysDate, 'YYYY/MM/DD').unix();
    const articleInfo = `south_carolina: ${county}; ${title}; ${subTitle}`;
    const extraDataInfo = {
      county,
      title,
      subTitle,
      articleFullText,
      ingestpurpose: 'mdsbackup',
    };

    posts.push(
      new Post({
        text: articleInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Live 5 News',
  baseURLPrefix,
  [
    {
      selector: ['.top-featured .card-deck .card , .middle-featured .card-deck .card , .middle-top .card-deck .card'],
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
