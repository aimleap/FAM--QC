import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://brandon.ca/news/media-releases';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const date = $(elements).find('.page-header').text().trim();
  const descriptionEvent = $(elements).find('p').text().trim();
  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const mediaReleasesInfo = `${date} ; ${descriptionEvent}`;
  const extraDataInfo = {
    Date: date,
    'Description & Event': descriptionEvent,
  };
  if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: mediaReleasesInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('Brandon Police Service', baseURL, [
  {
    selector: ['.mainContent .item-content'],
    parser: postHandler,
    name: 'post',
  },
]);
