import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const urlPrefix = 'https://www.mod.go.jp';
const urlSuffix = '/j/update/update_ja.js';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  moment.locale('ja');
  const jsonArray = JSON.parse(response.body.replace('var updateBox = ', '').trim());
  jsonArray.forEach((jsonObj: any) => {
    const releaseDate = `${jsonObj.mm}/${jsonObj.dd}`;
    if (moment(releaseDate, 'MM/DD').isSame(moment(), 'day')) {
      const { title } = jsonObj;
      const pressInfo = `${title}`;
      const timestamp = moment(releaseDate, 'MM/DD').unix();
      posts.push(
        new Post({
          text: pressInfo,
          postUrl: url,
          postedAt: timestamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Japan MOD Press Releases',
  urlPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  urlSuffix,
);
