import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://aerospace.org/reentries/grid';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const predictedReentryTime = $(el).find('td.views-field-field-predicted-reentry-time .field-data').text().replace(/\n+/g, '')
      .trim();
    if (moment(predictedReentryTime, 'll').isSame(moment(), 'day')) {
      const object = $(el).find('td.views-field-title .field-data').text().trim();
      const mission = $(el).find('td.views-field-field-mission .field-data').text().trim();
      const reEntryType = $(el).find('td.views-field-field-reentry-type .field-data').text().trim();
      const launched = $(el).find('td.views-field-field-launched .field-data').text().trim();
      const timestamp = moment(predictedReentryTime, 'll').unix();
      const aeroSpaceInfo = `${object}; ${mission}; ${reEntryType}; ${launched}; ${predictedReentryTime}`;
      const extraDataText = {
        Object: object, Mission: mission, 'Reentry Type': reEntryType, Launched: launched, 'Predicted Reentry Time': predictedReentryTime,
      };

      posts.push(
        new Post({
          text: aeroSpaceInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Aerospace Corporation', baseURL, [
  {
    selector: ['.views__table table tbody tr'],
    parser: postHandler,
    name: 'post',
  },
]);
