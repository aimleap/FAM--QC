import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://api.belqees.net';
const baseURLSuffix = '/core/locals/?page=1&per_page=25';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const responseText = response.body;
  const formattedResponseText = $(responseText).find('pre.prettyprint').text().split('Vary: Accept')[1].trim();
  const jsonObj = JSON.parse(formattedResponseText);
  const jsonArray = jsonObj.results;
  jsonArray.forEach((jObj: any) => {
    const date = jObj.published_at;
    const dateText = date.split('T')[0];
    if (moment(dateText, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const { title } = jObj;
      const text = jObj.description;
      const Url = jObj.url.long;
      const timestamp = moment(dateText, 'YYYY-MM-DD').unix();
      const textInfo = `${text}`;
      const extraDataInfo = {
        Date: dateText,
        discussion_title: title,
      };

      posts.push(
        new Post({
          text: textInfo,
          postUrl: Url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Belqees',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
