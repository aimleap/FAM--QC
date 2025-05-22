import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { Response } from 'request';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];

  //contractor code here

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

  //contractor code here

  return posts;
}

export const parser = new LiteParser('NAME', 'URL', [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
  },
]);
