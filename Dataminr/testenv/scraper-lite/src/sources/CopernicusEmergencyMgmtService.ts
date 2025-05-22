import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://emergency.copernicus.eu/mapping/list-of-activations-rapid';
const dataURL = 'https://poc-d8.lolandese.site/search-activations1';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const eventDate = $(el).find('td.views-field-field-activationtime').text().trim();
    if (typeof eventDate !== 'undefined' && moment(eventDate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const actCode = $(el).find('td.views-field-field-activation-code').text().trim();
      const title = $(el).find('td.views-field-title').text().trim();
      const eventType = $(el).find('td.views-field-field-category').text().trim();
      const country = $(el).find('td.views-field-field-countries').text().trim();
      const alertLink = $(el).find('td.views-field-title a').attr('href').trim();
      const timestamp = moment(eventDate, 'YYYY-MM-DD').unix();
      const aeroSpaceInfo = `${actCode}; ${title}; ${eventDate}; ${eventType}; ${country}; ${alertLink}`;
      const extraDataText = {
        'Act. Code': actCode, Title: title, 'Event Date': eventDate, Type: eventType, 'Country/Terr.': country, 'Alert Link': alertLink,
      };

      posts.push(
        new Post({
          text: aeroSpaceInfo,
          postUrl: baseURL,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Copernicus Emergency Management Service', dataURL, [
  {
    selector: ['table.views-table tbody tr'],
    parser: postHandler,
    name: 'post',
  },
]);
