import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseUrlPrefix = 'https://data.seattle.gov';
const baseUrlSuffix = '/api/id/kzjm-xkqj.json?$query=select%20*%2C%20%3Aid%20order%20by%20%60datetime%60%20desc%20limit%20100';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const responseText = response.body;
  const jsonArray = JSON.parse(responseText);
  jsonArray.forEach((jObj: any) => {
    const date = jObj.datetime;
    const dateText = date.split('T')[0];
    const { type } = jObj;
    const { address } = jObj;
    const timestamp = moment(dateText, 'YYYY-MM-DD').unix();
    const articleInfo = `${type} at ${address}, Seattle, WA`;

    if (moment(dateText, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: articleInfo,
          postedAt: timestamp,
          postUrl:
            'https://data.seattle.gov/Public-Safety/Seattle-Real-Time-Fire-911-Calls/kzjm-xkqj/data',
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Seattle Fire',
  baseUrlPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseUrlSuffix,
);
