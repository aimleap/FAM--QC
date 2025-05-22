import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://www.afternic.com/new-website-domains';
async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  for (let index = 1; index <= 10; index++) {
    threads.push({
      link: `https://www.afternic.com/ajax/home?AJAX=1&service=newListing&page=${index}`,
      parserName: 'post',
    });
  }
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const jsonArray = JSON.parse(response.body).response;
  jsonArray.forEach((jObj: any) => {
    const domainName = jObj.name;
    const timestamp = moment().unix();
    const textInfo = `${domainName}`;
    const extraDataInfo = {
      auction_url: domainName,
      drop_type: 'auction',
    };
    posts.push(
      new Post({
        text: textInfo,
        postUrl: baseURL,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser('Afternic', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
