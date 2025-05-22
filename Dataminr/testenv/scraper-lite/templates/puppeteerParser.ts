import { ElementHandle, Page } from 'puppeteer';
import PuppeteerParser from '../lib/parsers/puppeteerParser';
import { Post, Thread } from '../lib/types';

async function postHandler(page: Page, url: string, data: string[]): Promise<Post[]> {
  const posts: Post[] = [];
  const elementHandles: ElementHandle[] = await page.$$('a');
  return posts;
}

export const parser = new PuppeteerParser('NAME', 'URL', [
  {
    parser: postHandler,
    name: 'post',
  },
]);
