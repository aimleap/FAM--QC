import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.sosmediasburundi.org';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('YYYY/MM/DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $el.find('.item_content h4 a').attr('href');
    if (link.includes(todaysDate)) {
      const title = $el.find('.item_content h4').text();
      const href = $el.find('.item_content h4 a').attr('href');
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
  if (url === baseURL) {
    return posts;
  }
  moment.locale('fr');
  const dateQuery = '.full_meta .meta_date';
  const dateString = fetchText(dateQuery, $, elements);
  const date = moment(dateString, 'LL');

  const titleQuery = '.entry_content .entry_title';
  const textQuery = '.entry_content > p';

  const title = fetchText(titleQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'LL').unix();
  const textInfo = `${text}`;
  const extraDataInfo = {
    discussion_title: title,
  };
  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('SOS Medias Burundi', baseURL, [
  {
    selector: ['.row .col_6_of_12'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
