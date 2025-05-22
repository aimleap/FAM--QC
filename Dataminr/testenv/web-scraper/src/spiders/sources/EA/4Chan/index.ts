import moment from 'moment';
import { SourceType, ThreadType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { boards } from './boards';
import AuthParser from '../../../parsers/AuthParser';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: '4Chan',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.4chan.org/',
  expireIn: 240,
  injectHeaders: true,
};

export function getNextPage(url: string): ThreadType | null {
  const match = url.match(/\d+$/);
  let page = 1;

  if (Array.isArray(match) && match.length > 0) {
    page = parseInt(match[0], 10);
  }

  if (page >= 10) return null;

  return {
    // @ts-ignore
    title: '',
    link: `${url.replace(/\d+$/, '')}${page + 1}`,
    timestamp: moment().unix(),
    parserName: 'post',
  };
}

async function threadHandler(): Promise<ThreadType[]> {
  const now = moment().unix();
  return boards.map((t) => ({
    title: t,
    link: `https://boards.4chan.org${t}`,
    timestamp: now,
    parserName: 'post',
    delay: (Math.floor(Math.random() * 15) + 1) * 1000, // Delay from 1 to 15 min
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<Post[] | ThreadType[]> {
  const posts = elements
    .map((el) => {
      try {
        const $el = $(el);
        $el.find('.postMessage').remove('a');
        $el.find('.postMessage').remove('br');
        const message = $el.find('.postMessage').text().trim().replace(/>>\d+/g, '');
        const timestamp = parseInt($el.find('.postInfo .dateTime').attr('data-utc') || '', 10);
        const postUrl = $el.find('.postInfo .postNum > a:first-child').attr('href');
        const username = $el.find('.desktop .name').text().trim() || '';
        return new Post(
          message,
          {
            current_url: `${url.replace(/\d+$/, '')}${postUrl}`,
            author_name: username,
          },
          timestamp,
        );
      } catch (e) {
        return null;
      }
      /* eslint-disable camelcase */
    })
    // @ts-ignore
    .filter((x) => x?.posted_at >= backFilledTimestamp);

  /* eslint-enable camelcase */

  /* Crawl next page */
  if (posts.length > 0) {
    const thread = getNextPage(url);
    // @ts-ignore
    if (thread !== null) posts.push(thread);
  }
  // @ts-ignore
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['body'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.postContainer'],
      handler: postHandler,
    },
  ],
  10,
);
