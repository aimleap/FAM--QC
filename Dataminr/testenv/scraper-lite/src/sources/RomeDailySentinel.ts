import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://romesentinel.com';
const baseURLSuffix = '/news/';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('.dateline span[itemprop="datePublished"]').text();
    const formattedDate = moment(date).format('MM/DD/YYYY');
    if (moment(formattedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const title = $el.find('.headline a').text().replace(/\n+/g, '').replace(/\t+/g, '')
        .trim();
      const description = $el.find('.lead').text().replace(/\n+/g, '').replace(/\t+/g, '')
        .trim();
      const link = $el.find('.headline a').attr('href');
      const timestamp = moment(date, 'MM/DD/YYYY').unix();
      const articleInfo = `${title} ; ${description} ; ${formattedDate}`;
      const extraDataInfo = {
        title,
        description,
        formattedDate,
        ingestpurpose: 'mdsbackup',
      };
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: baseURLPrefix + link,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Rome Daily Sentinel',
  baseURLPrefix,
  [
    {
      selector: ['.story_list .item'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
