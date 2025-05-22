import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.yonhapnewstv.co.kr';
const baseURLSuffix = '/news/headline';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text().replace(/\n+/g, '').replace(/\t+/g, ' ')
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const titleQuery = '.subTitle+strong.title';
  const dateQuery = 'ul.info';
  const articleTextQuery = '#articleBody';
  $(elements).find('.fr-img-wrap').remove();
  const dateText = fetchText(dateQuery, $, elements).replace('송고시간', '').trim();
  const date = moment(dateText, 'YYYY-MM-DD hh:mm:ss').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm:ss').unix();
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

export const parser = new LiteParser('Yonhap News TV', baseURLPrefix, [
  {
    selector: ['.cont a[href^=/news/MYH], a.title[href^=/news/MYH]'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
