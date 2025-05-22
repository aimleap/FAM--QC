import { Response } from 'request';
import { Post } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';
import { AnznSelectors, extractAnznPosts } from '../lib/sourceUtil';

const baseURLPrefix = 'https://anzn.net';
const baseURLSuffix = '/sp/?p=22130F';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const keyLocationQuery = 'h3 small:eq(1)';
  const detailedLocationQuery = 'h3 .cSmall';
  const eventDescriptionQuery = 'p';
  const dateQuery = 'h3 small:eq(0)';
  const eventTypeQuery = 'h3';
  const selectorList: AnznSelectors = {
    keyLocationQuery, detailedLocationQuery, eventDescriptionQuery, dateQuery, eventTypeQuery,
  };
  return extractAnznPosts(
    selectorList,
    url,
    response,
  );
}

export const parser = new LiteParser(
  'Anzn Hamamatsu',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
  {
    encoding: 'binary',
  },
);
