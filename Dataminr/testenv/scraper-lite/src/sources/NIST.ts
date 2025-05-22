import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const now = moment().format('YYYY-MM-DD');
  const startDate = `${now}T00:00:00:000 UTC-05:00`;
  const endDate = `${now}T23:59:59:999 UTC-05:00`;
  threads.push({
    link: `https://services.nvd.nist.gov/rest/json/cves/1.0/?pubStartDate=${startDate}&pubEndDate=${endDate}`,
    parserName: 'post',
  });
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
  if (url === 'https://nvd.nist.gov/developers/vulnerabilities') {
    return posts;
  }
  const timestamp = moment().unix();
  const jsonResponse = JSON.parse(response.body);
  const extraDataInfo = {
    api_call_timestamp: timestamp,
  };

  posts.push(
    new Post({
      text: jsonResponse,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('NIST', 'https://nvd.nist.gov/developers/vulnerabilities', [
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
