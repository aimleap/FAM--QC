import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://news.stv.tv';
const baseUrlSuffix = '/section/west-central';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const time = $el.find('div.post-content>.meta span.timestamp').text();
    if (time.includes('hours ago') || time.includes('mins ago') || time.includes('minutes ago')) {
      const href = $el.find('.headline-container>a').attr('href');
      const title = $el.find('.headline-container>a').text();
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const headLineTitleQuery = '.headline-container>.headline';
  const subHeadTitleQuery = '.headline-container>.subhead';
  const articleTextQuery = '.content-body';

  $(elements).find('noscript').remove();
  const headLineTitle = fetchText(headLineTitleQuery, $, elements);
  const subHeadTitle = fetchText(subHeadTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const dateText = $(elements).find('time').attr('datetime').split(' ')[0].trim();
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

export const parser = new LiteParser('STV', baseUrlPrefix, [
  {
    selector: ['.desktop-table section, .frontpage-section section'],
    parser: threadHandler,
  },
  {
    selector: ['.main-content>.article'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
