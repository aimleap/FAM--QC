import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  ThreadType,
  SourceTypeEnum,
  appendLink,
  getPaginationThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'ayylidiz',
  type: SourceTypeEnum.FORUM,
  url: 'https://forum.ayyildiz.org',
  entryUrl: '/yeni-bul/mesajlar',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getPaginationThreadArray(
    $,
    elements,
    '.title a',
    ['..title a', '.itemPageNav a'],
    ($html: CheerioSelector, element: CheerioElement): number => parseInt($html(element).find('.lastPostInfo abbr').attr('data-time') || '', 10),
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
      $el.find('.bbCodeBlock').remove();
      const message = $el.find('blockquote').text().trim();
      const profileLink = $el.find('.messageUserInfo .username').attr('href') || '';
      const profileName = $el.find('.messageUserInfo .username').text();
      const timestamp = parseInt($el.find('.DateTime').attr('data-time') || '', 10);
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(source, $el.find('.postNumber').attr('href') || url),
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
      selector: ['li[id^="thread"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['li[id^="post-"'],
      handler: postHandler,
    },
  ],
  35,
);
