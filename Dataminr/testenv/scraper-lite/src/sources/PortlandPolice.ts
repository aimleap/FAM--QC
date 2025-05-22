import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.portlandonline.com/fire/apps/incidents_map.cfm';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  $(elements).find('#list strong').each((_rowIndex, row) => {
    const title = $(row).text().trim();
    const dateText = $(`strong:contains(${title}) ~ dl>dt:contains(Last Updated:)+dd:eq(0})`).text();
    const date = dateText.split(' ')[0]?.trim();
    const timestamp = moment(date, 'MM/DD/YY').unix();
    const articleInfo = `${title}LAND, OR`;
    if (moment(date, 'MM/DD/YY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: articleInfo,
          postedAt: timestamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Portland Police', baseURL, [
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
