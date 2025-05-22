import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://news.kbs.co.kr';
const baseUrlSuffix = '/news/pc/main/main.html';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text().replace(/\n+/g, '').replace(/\t+/g, '')
      .trim();
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) return [];
  const titleQuery = '.headline-title';
  const dateQuery = '.dates em.input-date';
  const articleTextQuery = '.view-article .detail-body';
  const dateText = fetchText(dateQuery, $, elements).replace('입력', '').trim();
  const date = moment(dateText, 'YYYY.MM.DD hh:mm').format('MM/DD/YYYY');
  if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
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
  }
  return posts;
}

export const parser = new LiteParser('Korean Broadcasting System', baseUrlPrefix, [
  {
    selector: ['a[href^=/news/view],a.box-content[href*=view.do]'],
    parser: threadHandler,
  },
  {
    selector: ['main#contents .view-contents-wrapper'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
