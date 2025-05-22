import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink,
  SourceType,
  ThreadType,
  SourceTypeEnum,
  getThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Tonel',
  type: SourceTypeEnum.FORUM,
  url: 'http://tonel.org/',
};

export const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp.trim(), 'YYYY/MM/DD, kk:mm').unix();

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray(
    $,
    elements,
    '.last-post-item .posturl',
    '.last-post-item .posturl',
    ($html: CheerioSelector, element: CheerioElement): number => toUnixTimestamp($html(element).find('.last-post-item .date-convert-none').text() || ''),
  );
}

async function postHandler(
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
      $el.find('.bbcode_container').remove();
      const message = $el.find('blockquote').text().trim();
      const profileLink = $el.find('.username_container a').attr('href') || '';
      const profileName = $el.find('.username_container a').text();
      const timestamp = toUnixTimestamp($el.find('.posthead .date-convert-full').text() || '');
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(source, $el.find('.posthead .postcounter').attr('href') || url),
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

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['li[id^="forum"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['#posts .postcontainer'],
      handler: postHandler,
    },
  ],
  35,
);
