import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://ruestungsindustrie.noblogs.org';
const baseURLSuffix = '/news/';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('.posted-on time.published').text().trim();
    if (moment(date, 'YYYY/MM/DD').isSame(moment(), 'day')) {
      const headline = $el.find('h2.entry-title').text();
      const href = $el.find('h2.entry-title a').attr('href');
      const text = $el.find('.entry-content').text().replace(/\n+/g, '').replace(/\t+/g, '')
        .trim();
      const timestamp = moment(date, 'YYYY/MM/DD').unix();
      const textInfo = `${text}`;
      const extraDataInfo = {
        Headline: headline,
        Date: date,
      };
      posts.push(
        new Post({
          text: textInfo,
          postUrl: href,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Rustungsindustrie Angreifen',
  baseURLPrefix,
  [
    {
      selector: ['.site-main article'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
