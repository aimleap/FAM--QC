import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://dpdbeat.com/';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.post-date').text().replace(/\n+/g, ' ')
      .replace(/\t+/g, '')
      .trim();
    const title = $(el).find('.entry-title').text().trim();
    const articleText = $(el).find('.entry-content').text().replace(/\n+/g, ' ')
      .trim();
    const postUrl = $(el).find('.entry-title a').attr('href');
    const timestamp = moment(date, 'MMM DD YYYY').unix();
    const casesInfo = `${title} ; ${date} ; ${articleText}`;
    const extraDataInfo = {
      Title: title,
      Date: date,
      Text: articleText,
    };
    if (moment(date, 'MMM DD YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: casesInfo,
          postUrl,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });

  return posts;
}

export const parser = new LiteParser('Dallas Police Department Beat', baseURL, [
  {
    selector: ['article'],
    parser: postHandler,
    name: 'post',
  },
]);
