import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://dsp.delaware.gov/newsroom/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const href = $(el).find('.panel-heading a').attr('href');
    if (href.includes(todaysDate)) {
      const title = $(el).find('.panel-heading a').text();
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
  if (url === baseURL) return posts;
  const titleQuery = 'header h1';
  const dateQuery = 'small.news-date em';
  const articleFullTextQuery = '#main_content p, #main_content ul';
  $(elements).find('#news-post-footer, .btn-default').remove();
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'dddd, MMMM DD, YYYY').unix();
  const articleInfo = `${title} ; ${date} ; ${articleFullText}`;
  const extraDataInfo = {
    Title: title,
    Date: date,
    Text: articleFullText,
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

export const parser = new LiteParser('Delaware State Ploice', baseURL, [
  {
    selector: ['section div.row'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
