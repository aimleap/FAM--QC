import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'http://www.tpdnews411.com/';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const date = $(el).find('h2.date-header').text().replace(/\n+/g, '')
      .trim();
    const formattedDate = moment(date, 'dddd, MMMM DD, YYYY').format('MM/DD/YYYY');
    if (moment(formattedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const title = $(el).find('h3.post-title').text().trim();
      const href = $(el).find('h3.post-title').attr('href');
      const text = $(el).find('.post-body').text().trim();
      const timestamp = moment(formattedDate, 'MM/DD/YYYY').unix();
      const aeroSpaceInfo = `${title}; ${formattedDate}; ${text}`;
      const extraDataText = {
        Title: title,
        Date: formattedDate,
        Text: text,
      };

      posts.push(
        new Post({
          text: aeroSpaceInfo,
          postUrl: href,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('MBTA Transit Police', baseURL, [
  {
    selector: ['.blog-posts .date-outer'],
    parser: postHandler,
  },
]);
