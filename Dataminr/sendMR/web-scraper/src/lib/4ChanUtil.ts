import moment from 'moment';
import { appendLink, SourceType, ThreadType } from './parserUtil';
import Post from '../schema/post';

export function getNextPage(url: string, limit: number = 15): string {
  const match = url.match(/\d+.html$/);
  let page = 1;

  if (Array.isArray(match) && match.length > 0) {
    page = parseInt(match[0], 10);
  }

  return page >= limit ? '' : `${url.replace(/\d+.html$/, '')}${page + 1}.html`;
}

export function getNextPageThread(url: string): ThreadType | null {
  const nextUrl = getNextPage(url);
  return nextUrl.length === 0
    ? null
    : {
      title: '',
      link: nextUrl,
      timestamp: moment().unix(),
      parserName: 'post',
    };
}

export function generateBoardLinks(
  boards: string[],
  minDelay: number = 1,
  maxDelay: number = 7,
): ThreadType[] {
  const now = moment().unix();
  return boards.map((t) => ({
    title: t,
    link: t,
    timestamp: now,
    parserName: 'post',
    delay: (Math.floor(Math.random() * maxDelay) + minDelay) * 1000, // Delay from 1 to 7 min
  }));
}

export function getPost(source: SourceType, element: Cheerio, postNumber: number): Post {
  element.find('.divMessage a').remove();

  const timestamp = element
    .find('.labelCreated')
    .text()
    .replace(/\(.+\)\s+/, '');
  const postedAt = moment.utc(timestamp, 'MM/DD/YYYY hh:mm:ss').unix();
  const message = element.find('.divMessage').text().trim().replace(/>>\d+/, '');
  const currentUrl = appendLink(source, element.find('.linkSelf').attr('href') || '');
  const authorName = element.find('.linkName').text() || '';

  return new Post(
    message,
    {
      current_url: currentUrl,
      author_name: authorName,
    },
    postedAt,
    [],
    [],
    new Map([['post_num', postNumber.toString()]]),
  );
}

export async function postHandler(
  source: SourceType,
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<Post[] | ThreadType[]> {
  const posts = [];

  elements.forEach((thread) => {
    const result = [];
    const $thread = $(thread);
    const originalPost = $thread.find('.innerOP');
    const comments = $thread.find('.innerPost');
    result.push(getPost(source, originalPost, 0));
    comments.each((i, comment) => result.push(getPost(source, $(comment), i + 1)));
    result
      .filter((p) => p.posted_at >= backFilledTimestamp && p.text.length > 0)
      .forEach((p) => posts.push(p));
  });

  const nextPageThread = getNextPageThread(url);
  if (posts.length > 0 && nextPageThread !== null) posts.push(nextPageThread);

  // @ts-ignore
  return posts;
}
