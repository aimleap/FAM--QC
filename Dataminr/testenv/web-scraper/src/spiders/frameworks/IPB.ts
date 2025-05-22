import moment from 'moment';
import {
  appendLink, getPaginationThreadArray, SourceType, ThreadType,
} from '../../lib/parserUtil';
import Post from '../../schema/post';

export const getUnixTimestamp = (timestamp: string): number => moment.utc(timestamp.trim(), 'YYYY-MM-DDTHH:mm:ssZ').unix();

export function getIpbMainThreads($: CheerioSelector, elements: CheerioElement[]): ThreadType[] {
  return getPaginationThreadArray(
    $,
    elements,
    '.ipsDataItem_title a',
    ['.ipsDataItem_title a'],
    ($html: CheerioSelector, element: CheerioElement): number => getUnixTimestamp($html(element).find('.ipsType_light time').attr('datetime') || ''),
  ).map((t) => ({
    ...t,
    title: t.title.trim(),
    parserName: 'thread',
  }));
}

export async function mainThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getIpbMainThreads($, elements);
}

export function getIpbThreads($: CheerioSelector, elements: CheerioElement[]): ThreadType[] {
  return getPaginationThreadArray(
    $,
    elements,
    '.ipsType_break.ipsContained a[data-ipshover-timeout]',
    ['.ipsType_break.ipsContained a[data-ipshover-timeout]', '.ipsType_break.ipsContained a'],
    ($html: CheerioSelector, element: CheerioElement): number => getUnixTimestamp($html(element).find('.ipsDataItem_lastPoster time').attr('datetime') || ''),
  ).map((t) => ({
    ...t,
    title: t.title.trim(),
    parserName: 'post',
  }));
}

export function getIpsPosts(
  $: CheerioSelector,
  elements: CheerioElement[],
  source: SourceType,
): Post[] {
  // @ts-ignore
  return elements
    .map((el) => {
      try {
        const $el = $(el);
        $el.find('blockquote').remove();
        const message = $el.find('div[data-role="commentContent"]').text().trim();
        const profileLink = $el.find('.cAuthorPane_author a[id]').attr('href') || '';
        const profileName = $el.find('.cAuthorPane_author a[id]').text();
        const timestamp = getUnixTimestamp($el.find('.ipsType_reset time').attr('datetime') || '');
        return new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(
              source,
              $el.find('.ipsComment_tools li:last-child a').attr('href') || source.url,
            ),
          },
          timestamp,
          [],
        );
      } catch (e) {
        return null;
      }
    })
    .filter((x) => x !== null);
}

export async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getIpbThreads($, elements);
}

export async function postHandler(
  source: SourceType,
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    try {
      const $el = $(el);
      $el.find('blockquote').remove();
      const message = $el.find('div[data-role="commentContent"]').text().trim();
      const profileLink = $el.find('.cAuthorPane_author a[id]').attr('href') || '';
      const profileName = $el.find('.cAuthorPane_author a[id]').text();
      const timestamp = getUnixTimestamp($el.find('.ipsType_reset time').attr('datetime') || '');
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(
              source,
              $el.find('.ipsComment_tools li:last-child a').attr('href') || url,
            ),
          },
          timestamp,
          forumPaths,
        ),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}
