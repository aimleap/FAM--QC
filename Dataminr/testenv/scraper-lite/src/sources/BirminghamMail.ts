import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';
import { Post, Thread } from '../lib/types';

const baseUrlPrefix = 'https://www.birminghammail.co.uk';
const baseUrlSuffix = '/news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const title = $el.text();
    threads.push({
      link: href,
      title,
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  let dateText = $(elements).find('.time-info time.date-published').attr('datetime')?.split('T')[0].trim();
  if (typeof dateText === 'undefined') {
    const updatedDate = $(elements).find('.time-info time.date-updated').text().split(', ')[1].trim();
    dateText = moment(updatedDate, 'DD MMM YYYY').format('YYYY-MM-DD');
  }
  if (moment(dateText, 'YYYY-MM-DD').isSame(moment(), 'day')) {
    const headLineTitleQuery = 'h1.section-theme-background-indicator';
    const subHeadTitleQuery = 'p.sub-title';
    const articleTextQuery = '.article-body p:not(:has(b))';
    const headLineTitle = fetchText(headLineTitleQuery, $, elements);
    const subHeadTitle = fetchText(subHeadTitleQuery, $, elements);
    const articleText = fetchText(articleTextQuery, $, elements);
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
  }
  return posts;
}

export const parser = new LiteParser('Birmingham Mail', baseUrlPrefix, [
  {
    selector: ['.pancake.channel-news .teaser>a.headline'],
    parser: threadHandler,
  },
  {
    selector: ['body article'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
