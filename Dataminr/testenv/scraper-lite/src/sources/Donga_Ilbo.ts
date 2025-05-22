import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.donga.com/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYYMMDD');
  elements.forEach((el) => {
    const link = $(el).find('h3.tit a, a').attr('href');
    if (link.includes(todaysDate)) {
      const href = $(el).find('h3.tit a, a').attr('href');
      const description = $(el).find('.list_cont, .desc, a').text().replace(/\n+/g, ' ')
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
  if (url === baseURL) return [];
  const titleQuery = '.article_title h1.title';
  const dateQuery = '.article_title .title_foot .date01:eq(0)';
  const articleTextQuery = '#article_txt';
  $(elements).find('.article_footer').remove();
  const dateText = fetchText(dateQuery, $, elements).replace('입력', '').trim();
  const date = moment(dateText, 'YYYY-MM-DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(titleQuery, $, elements);
  const description = data[0];
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY-MM-DD hh:mm').unix();
  const newsInfo = `${title} ; ${description}`;
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

export const parser = new LiteParser('Donga Ilbo', baseURL, [
  {
    selector: ['.headline_box .top_title, .headline_box .cont_info li, .mainnews_wrap .mainnews_cont .mainnews_group .group .cont_info, .main_aside li .cont_info'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
