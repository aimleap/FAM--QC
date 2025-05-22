import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp).unix();
const baseUrl = 'https://www.fra.dot.gov/blockedcrossings/incidents';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];

  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const jsonArray = JSON.parse(response.body).items;
  jsonArray.forEach((jsonObj: any) => {
    const dateTime = jsonObj.dateTime !== '' ? moment(jsonObj.dateTime).format('YYYY-MM-DD') : '';

    if (dateTime !== '') {
      if (moment(dateTime).isAfter(yesterday)) {
        const { crossingID } = jsonObj;
        const { reason } = jsonObj;
        const city = jsonObj.city === null ? '' : jsonObj.city;
        const { state } = jsonObj;
        const { street } = jsonObj;
        const { railroad } = jsonObj;
        const date = moment(jsonObj.dateTime).format('MM/DD/YYYY');
        const time = moment(jsonObj.dateTime).format('LT');
        const { duration } = jsonObj;
        const timestamp = toUnixTimestamp(jsonObj.dateTime);

        const trainBlockages = `Crossing ID: ${crossingID} - Reason: ${reason} - City: ${city} - State: ${state} - Street: ${street} - Railroad: ${railroad} - Date: ${date} - Time: ${time} - Duration: ${duration}`;
        const extraDataInfo = {
          Crossing_ID: crossingID,
          Reason: reason,
          City: city,
          State: state,
          Street: street,
          Railroad: railroad,
          Date: date,
          Time: time,
          Duration: duration,
        };

        posts.push(
          new Post({
            text: trainBlockages,
            postUrl: baseUrl,
            postedAt: timestamp,
            extraData: extraDataInfo,
          }),
        );
      }
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Federal Railroad Administration - Train Blockages',
  'https://www.fra.dot.gov/blockedcrossings/api/incidents?page=1&pageSize=1000',
  [
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
