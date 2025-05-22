import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://ccpdblotter.wordpress.com/';
async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const date = $(el).find('time.entry-date').text().replace(/\n+/g, '')
      .trim();
    if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const eventType = $(el)
        .find('h1.entry-title')
        .text()
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
      const href = $(el).find('h1.entry-title a').attr('href');
      const text = $(el)
        .find('.entry-content')
        .text()
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
      const timestamp = moment(date, 'MMMM DD, YYYY').unix();
      const aeroSpaceInfo = `${eventType}; ${date}; ${text}`;
      const extraDataText = {
        'Event Type': eventType,
        Date: date,
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

export const parser = new LiteParser('Corpus Christi Police', baseURL, [
  {
    selector: ['.site-content article'],
    parser: postHandler,
  },
]);
