import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://gtaupdate.com/';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const added = $(el).find('td:eq(0)').text().trim();
    const district = $(el).find('td:eq(1)').text().trim();
    let type = $(el).find('td:eq(2)').text();
    const eventType = type.split('-')[0].trim();
    const eventLocation = type
      .substring(type.indexOf('-') + 1)
      .replace('-', '/')
      .trim();
    if (!district.includes('TFS')) {
      type = `${eventType} at ${eventLocation}, Toronto, ON, Canada`;
    }
    const timestamp = moment(added, ['hh:mm a', 'MMM-DD hh:mm a']).unix();
    const eventInfo = `${type}`;
    const extraDataText = {
      text: type,
      added,
      district,
      event_type: eventType,
      event_location: eventLocation,
      event_location_two: eventLocation,
    };
    if (moment(added, ['hh:mm a', 'MMM-DD hh:mm a']).isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: eventInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('GTA Update', baseURL, [
  {
    selector: ['table tbody tr:not(:has(th))'],
    parser: postHandler,
  },
]);
