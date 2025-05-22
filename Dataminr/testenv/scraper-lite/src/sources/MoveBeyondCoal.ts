import moment from 'moment';
import striptags from 'striptags';
import request from 'request-promise';
import { Post } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';

const domain = 'https://www.movebeyondcoal.com/';

async function postHandler(): Promise<Post[]> {
  // https://www.movebeyondcoal.com/data/site_events.json?page=1682008995800
  const url = appendLink(
    domain,
    `/data/site_events.json?page=${moment().subtract(1, 'hour').valueOf()}`,
  );

  let json = null;

  try {
    await request({ url, resolveWithFullResponse: true });
  } catch (e: any) {
    if (e.response && e.response.body) {
      json = JSON.parse(e.response.body);
    }
  }

  if (json === null || !Array.isArray(json)) return [];

  return json.map(
    (x: any) => new Post({
      text: striptags(x.content, [], ''),
      postedAt: x.start_at_unix,
      postUrl: x.url,
      extraData: {
        URL: x.url,
      },
    }),
  );
}

export const parser = new LiteParser('Move Beyond Coal event page', domain, [
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
