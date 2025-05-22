import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.burbankpd.org/news/';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const dateTime = $(el).find('.dateStamp').text().replace(/\n+/g, '')
      .trim();
    const description = $(el).find('p').text().trim();
    const pdfLink = `https://www.burbankpd.org${$(el).find('.moreLink a').attr('href')}`;
    const timestamp = moment(dateTime, 'MMM DD, YYYY hh:mm a').unix();
    const newsInfo = `${title} ; ${dateTime} ; ${description}`;
    const extraDataInfo = {
      Title: title,
      'Date Time': dateTime,
      Description: description,
      'PDF Document Link': pdfLink,
    };
    if (moment(dateTime, 'MMM DD, YYYY hh:mm a').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: newsInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Burbank Police Department', baseURL, [
  {
    selector: ['.newsItemsWrpr>.newsItemWrpr'],
    parser: postHandler,
  },
]);
