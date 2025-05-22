import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'http://20th.cpcnews.cn';
const baseURLSuffix = '/98/index.html';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todayDate = moment().format('YYYY/MMDD');
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  moment.locale('zh-cn');
  const headlineQuery = '.conn .text_c h1';
  const articleTextQuery = '.conn .text_c .show_text';
  const dateQuery = '.sou';
  const headline = fetchText(headlineQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split('来源:')[0].trim();
  const date = moment(dateText, 'YYYY MM DD hh:mm').format('DD/MM/YYYY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY MM DD hh:mm').unix();
  const newsInfo = `${headline}, Date: ${date}`;
  const extraDataInfo = {
    Headline: headline,
    Date: date,
    'Article Text': articleText,
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

export const parser = new LiteParser('China 20th Party Congress News', baseURLPrefix, [
  {
    selector: ['ul>li a'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
