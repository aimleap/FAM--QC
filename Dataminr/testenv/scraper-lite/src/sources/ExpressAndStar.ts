import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.expressandstar.com';
const baseUrlSuffix = '/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const todaysDate = moment().format('YYYY/MM/DD');
    const $el = $(el);
    const link = $el.find('a').attr('href');
    if (typeof link !== 'undefined' && link.includes(todaysDate)) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('h1').text().replace(/\n+/g, '').trim();
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const headLineTitleQuery = 'h1.story-headline';
  const subHeadTitleQuery = 'p.story-subheadline';
  const articleTextQuery = '.story-content .story-content-text';

  const headLineTitle = fetchText(headLineTitleQuery, $, elements);
  const subHeadTitle = fetchText(subHeadTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const dateText = $(elements).find('span:contains(Published:) time').attr('datetime').split('T')[0].trim();
  const date = moment(dateText, 'YYYY-MM-DD').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${subHeadTitle},  ${articleText}`;
  const extraDataInfo = { discussion_title: headLineTitle, Date: date };
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

export const parser = new LiteParser('Express & Star', baseUrlPrefix, [
  {
    selector: ['article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
